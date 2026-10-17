import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toHundredths,
  toMinorUnits,
} from '@routeops/shared/money';
import { RouteAccessError } from '../application/route-access-error';
import {
  driverError,
  ManagementMode,
  managementModes,
  RouteChoice,
  RouteChoices,
  RouteOrganization,
  RouteProblem,
  selectedDays,
  TransportRoute,
  TransportRouteDetails,
  VehicleShareMode,
  vehicleShareModes,
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
  deleteRoute(organizationId: string, routeId: string): Promise<void>;
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
  | 'outbound_arrival_time'
  | 'return_time'
  | 'return_arrival_time'
  | 'operating_days'
  | 'trip_price'
  | 'management_mode'
  | 'management_percent'
  | 'management_amount'
  | 'vehicle_share_mode'
  | 'vehicle_share_percent'
  | 'vehicle_share_amount'
  | 'notes'
  | 'is_active'
>;

const routeColumns =
  'id, name, customer_id, vehicle_id, driver_id, start_point, end_point, outbound_time, outbound_arrival_time, return_time, return_arrival_time, operating_days, trip_price, management_mode, management_percent, management_amount, vehicle_share_mode, vehicle_share_percent, vehicle_share_amount, notes, is_active';

const uniqueViolation = '23505';
// Raised by the database when an active route names an inactive choice.
const inactiveChoice = 'inactive_choice';
// The check that keeps a route's fixed shares within its shift price.
const splitWithinPrice = 'routes_split_within_price';
const driverOverlap = 'driver_overlap';
const vehicleOverlap = 'vehicle_overlap';
// Raised when a trip still names the route on delete.
const inUse = 'in_use';

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
        .select('id, plate_number, is_active, ownership')
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
      vehicles: (vehicles.data ?? []).map((row) => ({
        ...choice(row.id, row.plate_number, row.is_active),
        owned: row.ownership === 'owned',
      })),
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

  // Row level security hides a row the member may not delete, so no deleted
  // row means it was not removed.
  async deleteRoute(organizationId: string, routeId: string): Promise<void> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .delete()
      .eq('id', routeId)
      .eq('organization_id', organizationId)
      .select('id');
    if (error) {
      throw new RouteAccessError(error.message === inUse ? 'inUse' : 'remove');
    }
    if (!data || data.length === 0) {
      throw new RouteAccessError('remove');
    }
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new RouteAccessError('notConnected');
    }
    return this.client;
  }
}

function saveProblem(error: PostgrestError | null): RouteProblem {
  if (error?.message === inactiveChoice) {
    return 'inactiveChoice';
  }
  if ((error?.message ?? '').includes(splitWithinPrice)) {
    return 'splitTooHigh';
  }
  if (error?.message === driverOverlap) {
    return 'driverOverlap';
  }
  if (error?.message === vehicleOverlap) {
    return 'vehicleOverlap';
  }
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
    outboundArrivalTime: toClock(row.outbound_arrival_time),
    returnTime: toClock(row.return_time),
    returnArrivalTime: toClock(row.return_arrival_time),
    days: toDays(row.operating_days),
    tripPrice: toAmountText(row.trip_price, currency),
    managementMode: oneOf(managementModes, row.management_mode),
    managementPercent: percentText(row.management_percent),
    managementAmount: toAmountText(row.management_amount, currency),
    vehicleShareMode: oneOf(vehicleShareModes, row.vehicle_share_mode),
    vehicleSharePercent: percentText(row.vehicle_share_percent),
    vehicleShareAmount: toAmountText(row.vehicle_share_amount, currency),
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function oneOf<T extends string>(values: readonly T[], value: string): T {
  if (!(values as readonly string[]).includes(value)) {
    throw new RouteAccessError('load');
  }
  return value as T;
}

// The database keeps a percent such as 33.50; the form shows "33.5".
function percentText(value: number | null): string {
  return value === null ? '' : String(Number(value));
}

// Only the value of the chosen way is kept, as the database requires.
function splitColumns(details: TransportRouteDetails, currency: Currency) {
  return {
    management_mode: details.managementMode,
    management_percent: percentColumn(details.managementMode, details.managementPercent),
    management_amount: amountColumn(details.managementMode, details.managementAmount, currency),
    vehicle_share_mode: details.vehicleShareMode,
    vehicle_share_percent: percentColumn(details.vehicleShareMode, details.vehicleSharePercent),
    vehicle_share_amount: amountColumn(details.vehicleShareMode, details.vehicleShareAmount, currency),
  };
}

function percentColumn(
  mode: ManagementMode | VehicleShareMode,
  text: string,
): number | null {
  if (mode !== 'percent') {
    return null;
  }
  const hundredths = toHundredths(text);
  if (typeof hundredths !== 'number' || hundredths > 10000) {
    throw new RouteAccessError('percent');
  }
  return hundredths / 100;
}

function amountColumn(
  mode: ManagementMode | VehicleShareMode,
  text: string,
  currency: Currency,
): number | null {
  if (mode !== 'amount') {
    return null;
  }
  const minor = toMinorUnits(text, currency);
  if (typeof minor !== 'number') {
    throw new RouteAccessError('tripPrice');
  }
  return minor;
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
    outbound_arrival_time: blankToNull(details.outboundArrivalTime),
    return_time: blankToNull(details.returnTime),
    return_arrival_time: blankToNull(details.returnArrivalTime),
    operating_days: selectedDays(details.days)
      .map((day) => dayNumbers[day])
      .sort((first, second) => first - second),
    trip_price: tripPrice,
    ...splitColumns(details, currency),
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
