import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from '@routeops/shared/money';
import { RouteAccessError } from '../application/route-access-error';
import {
  driverError,
  RouteChoice,
  RouteChoices,
  RouteOrganization,
  selectedDays,
  TransportRoute,
  TransportRouteDetails,
  Weekday,
  weekdays,
  WeekdaySelection,
} from '../domain/transport-route';
import { Database } from './database';

export interface RouteGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<RouteOrganization[]>;
  listRoutes(organization: RouteOrganization): Promise<TransportRoute[]>;
  listChoices(organizationId: string): Promise<RouteChoices>;
  insertRoute(
    organization: RouteOrganization,
    details: TransportRouteDetails,
  ): Promise<TransportRoute>;
  updateRoute(
    organization: RouteOrganization,
    routeId: string,
    details: TransportRouteDetails,
  ): Promise<TransportRoute>;
}

type RouteRow = Pick<
  Database['public']['Tables']['routes']['Row'],
  | 'id'
  | 'name'
  | 'customer_id'
  | 'vehicle_id'
  | 'driver_id'
  | 'start_point'
  | 'end_point'
  | 'outbound_time'
  | 'return_time'
  | 'operating_days'
  | 'trip_price'
  | 'notes'
  | 'is_active'
>;

const routeColumns =
  'id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, return_time, operating_days, trip_price, notes, is_active';

const uniqueViolation = '23505';

// PostgreSQL day-of-week numbers, which the routes table stores.
const dayNumbers: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export class SupabaseRouteGateway implements RouteGateway {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  async membershipOrganizations(userId: string): Promise<RouteOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name, currency)')
      .eq('user_id', userId);
    if (error) {
      throw new RouteAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [
            {
              id: row.organizations.id,
              name: row.organizations.name,
              currency: isCurrency(row.organizations.currency)
                ? row.organizations.currency
                : defaultCurrency,
            },
          ]
        : [],
    );
  }

  async listRoutes(organization: RouteOrganization): Promise<TransportRoute[]> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .select(routeColumns)
      .eq('organization_id', organization.id)
      .order('name');
    if (error) {
      throw new RouteAccessError('load');
    }
    return (data ?? []).map((row) => toRoute(row, organization.currency));
  }

  async listChoices(organizationId: string): Promise<RouteChoices> {
    const client = this.requireClient();
    const [customers, vehicles, drivers] = await Promise.all([
      client
        .from('customers')
        .select('id, name, is_active')
        .eq('organization_id', organizationId)
        .order('name'),
      client
        .from('vehicles')
        .select('id, plate_number, is_active')
        .eq('organization_id', organizationId)
        .order('plate_number'),
      client
        .from('drivers')
        .select('id, full_name, is_active')
        .eq('organization_id', organizationId)
        .order('full_name'),
    ]);
    if (customers.error || vehicles.error || drivers.error) {
      throw new RouteAccessError('load');
    }
    return {
      customers: (customers.data ?? []).map((row) =>
        choice(row.id, row.name, row.is_active),
      ),
      vehicles: (vehicles.data ?? []).map((row) =>
        choice(row.id, row.plate_number, row.is_active),
      ),
      drivers: (drivers.data ?? []).map((row) =>
        choice(row.id, row.full_name, row.is_active),
      ),
    };
  }

  async insertRoute(
    organization: RouteOrganization,
    details: TransportRouteDetails,
  ): Promise<TransportRoute> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .insert({
        organization_id: organization.id,
        ...toColumns(details, organization.currency),
      })
      .select(routeColumns)
      .single();
    if (error || !data) {
      throw new RouteAccessError(saveProblem(error));
    }
    return toRoute(data, organization.currency);
  }

  async updateRoute(
    organization: RouteOrganization,
    routeId: string,
    details: TransportRouteDetails,
  ): Promise<TransportRoute> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .update(toColumns(details, organization.currency))
      .eq('id', routeId)
      .eq('organization_id', organization.id)
      .select(routeColumns)
      .single();
    if (error || !data) {
      throw new RouteAccessError(saveProblem(error));
    }
    return toRoute(data, organization.currency);
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new RouteAccessError('notConnected');
    }
    return this.client;
  }
}

function saveProblem(error: PostgrestError | null) {
  return error?.code === uniqueViolation ? 'nameTaken' : 'save';
}

function choice(id: string, label: string, active: boolean): RouteChoice {
  return { id, label, active };
}

function toRoute(row: RouteRow, currency: Currency): TransportRoute {
  return {
    id: row.id,
    name: row.name,
    customerId: row.customer_id,
    vehicleId: row.vehicle_id ?? '',
    driverId: row.driver_id,
    startPoint: row.start_point,
    endPoint: row.end_point,
    outboundTime: toClock(row.outbound_time),
    returnTime: toClock(row.return_time),
    days: toDays(row.operating_days),
    tripPrice: toAmountText(row.trip_price, currency),
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: TransportRouteDetails, currency: Currency) {
  const missingDriver = driverError(details.driverId);
  if (missingDriver) {
    throw new RouteAccessError(missingDriver);
  }
  const tripPrice = toMinorUnits(details.tripPrice, currency);
  if (tripPrice === undefined) {
    throw new RouteAccessError('tripPrice');
  }
  return {
    name: details.name.trim(),
    customer_id: details.customerId,
    vehicle_id: blankToNull(details.vehicleId),
    driver_id: details.driverId,
    start_point: details.startPoint.trim(),
    end_point: details.endPoint.trim(),
    outbound_time: blankToNull(details.outboundTime),
    return_time: blankToNull(details.returnTime),
    operating_days: selectedDays(details.days)
      .map((day) => dayNumbers[day])
      .sort((first, second) => first - second),
    trip_price: tripPrice,
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

// PostgreSQL returns time as HH:MM:SS; the form works in HH:MM.
function toClock(value: string | null): string {
  return value === null ? '' : value.slice(0, 5);
}

function toDays(numbers: readonly number[]): WeekdaySelection {
  const selection = {} as Record<Weekday, boolean>;
  for (const day of weekdays) {
    selection[day] = numbers.includes(dayNumbers[day]);
  }
  return selection;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
