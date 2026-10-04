import { SupabaseClient } from '@supabase/supabase-js';
import { OperationsAccessError } from '../application/operations-access-error';
import {
  ChangeReason,
  DailyTrip,
  OperationChoice,
  OperationChoices,
  OperationsOrganization,
  isTripRecording,
  TripChange,
  TripDirection,
  TripRecording,
} from '../domain/daily-trip';
import { Database } from './database';

export interface OperationsGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<OperationsOrganization[]>;
  prepareDay(organizationId: string, serviceDate: string): Promise<void>;
  listTrips(organizationId: string, serviceDate: string): Promise<DailyTrip[]>;
  listChoices(organizationId: string): Promise<OperationChoices>;
  readTripRecording(organizationId: string): Promise<TripRecording>;
  saveTripRecording(
    organizationId: string,
    recording: TripRecording,
  ): Promise<void>;
  updateTrip(
    organizationId: string,
    tripId: string,
    change: TripChange,
  ): Promise<DailyTrip>;
  updateDone(
    organizationId: string,
    tripId: string,
    done: boolean,
  ): Promise<DailyTrip>;
  cancelCustomerTrips(
    organizationId: string,
    serviceDate: string,
    customerIds: readonly string[],
  ): Promise<void>;
}

type TripRow = Pick<
  Database['public']['Tables']['daily_trips']['Row'],
  | 'id'
  | 'route_id'
  | 'service_date'
  | 'direction'
  | 'departure_time'
  | 'customer_id'
  | 'vehicle_id'
  | 'driver_id'
  | 'is_cancelled'
  | 'is_done'
  | 'change_reason'
  | 'notes'
>;

const tripColumns =
  'id, route_id, service_date, direction, departure_time, customer_id, vehicle_id, driver_id, is_cancelled, is_done, change_reason, notes';

const reasonColumns: Record<ChangeReason, string> = {
  holiday: 'holiday',
  vehicleBreakdown: 'vehicle_breakdown',
  driverAbsent: 'driver_absent',
  customerRequest: 'customer_request',
  other: 'other',
};

export class SupabaseOperationsGateway implements OperationsGateway {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  async membershipOrganizations(
    userId: string,
  ): Promise<OperationsOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name)')
      .eq('user_id', userId);
    if (error) {
      throw new OperationsAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [{ id: row.organizations.id, name: row.organizations.name }]
        : [],
    );
  }

  async prepareDay(organizationId: string, serviceDate: string): Promise<void> {
    const { error } = await this.requireClient().rpc('prepare_daily_trips', {
      p_organization_id: organizationId,
      p_service_date: serviceDate,
    });
    if (error) {
      throw new OperationsAccessError('load');
    }
  }

  async listTrips(
    organizationId: string,
    serviceDate: string,
  ): Promise<DailyTrip[]> {
    const { data, error } = await this.requireClient()
      .from('daily_trips')
      .select(tripColumns)
      .eq('organization_id', organizationId)
      .eq('service_date', serviceDate)
      .order('departure_time');
    if (error) {
      throw new OperationsAccessError('load');
    }
    return (data ?? []).map(toTrip);
  }

  async listChoices(organizationId: string): Promise<OperationChoices> {
    const client = this.requireClient();
    const [customers, vehicles, drivers, routes] = await Promise.all([
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
      client
        .from('routes')
        .select('id, name, is_active')
        .eq('organization_id', organizationId)
        .order('name'),
    ]);
    if (customers.error || vehicles.error || drivers.error || routes.error) {
      throw new OperationsAccessError('load');
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
      routes: (routes.data ?? []).map((row) =>
        choice(row.id, row.name, row.is_active),
      ),
    };
  }

  async readTripRecording(organizationId: string): Promise<TripRecording> {
    const { data, error } = await this.requireClient()
      .from('operations_settings')
      .select('trip_recording')
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (error) {
      throw new OperationsAccessError('load');
    }
    if (!data) {
      return 'automatic';
    }
    if (!isTripRecording(data.trip_recording)) {
      throw new OperationsAccessError('load');
    }
    return data.trip_recording;
  }

  async saveTripRecording(
    organizationId: string,
    recording: TripRecording,
  ): Promise<void> {
    const { error } = await this.requireClient().rpc('set_trip_recording', {
      p_organization_id: organizationId,
      p_trip_recording: recording,
    });
    if (error) {
      throw new OperationsAccessError('save');
    }
  }

  async updateTrip(
    organizationId: string,
    tripId: string,
    change: TripChange,
  ): Promise<DailyTrip> {
    if (change.reason === '') {
      throw new OperationsAccessError('reason');
    }
    return this.saveTrip(organizationId, tripId, {
      vehicle_id: blankToNull(change.vehicleId),
      driver_id: blankToNull(change.driverId),
      is_cancelled: change.cancelled,
      change_reason: reasonColumns[change.reason],
      notes: blankToNull(change.notes),
      ...(change.cancelled ? { is_done: false } : {}),
    });
  }

  updateDone(
    organizationId: string,
    tripId: string,
    done: boolean,
  ): Promise<DailyTrip> {
    return this.saveTrip(organizationId, tripId, { is_done: done });
  }

  private async saveTrip(
    organizationId: string,
    tripId: string,
    values: Database['public']['Tables']['daily_trips']['Update'],
  ): Promise<DailyTrip> {
    const { data, error } = await this.requireClient()
      .from('daily_trips')
      .update(values)
      .eq('id', tripId)
      .eq('organization_id', organizationId)
      .select(tripColumns)
      .single();
    if (error || !data) {
      throw new OperationsAccessError('save');
    }
    return toTrip(data);
  }

  async cancelCustomerTrips(
    organizationId: string,
    serviceDate: string,
    customerIds: readonly string[],
  ): Promise<void> {
    const { error } = await this.requireClient()
      .from('daily_trips')
      .update({
        is_cancelled: true,
        is_done: false,
        change_reason: reasonColumns.holiday,
      })
      .eq('organization_id', organizationId)
      .eq('service_date', serviceDate)
      .in('customer_id', [...customerIds]);
    if (error) {
      throw new OperationsAccessError('save');
    }
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new OperationsAccessError('notConnected');
    }
    return this.client;
  }
}

function choice(id: string, label: string, active: boolean): OperationChoice {
  return { id, label, active };
}

function toTrip(row: TripRow): DailyTrip {
  return {
    id: row.id,
    routeId: row.route_id,
    serviceDate: row.service_date,
    direction: toDirection(row.direction),
    departureTime: row.departure_time.slice(0, 5),
    customerId: row.customer_id,
    vehicleId: row.vehicle_id ?? '',
    driverId: row.driver_id ?? '',
    cancelled: row.is_cancelled,
    reason: toReason(row.change_reason),
    notes: row.notes ?? '',
    done: row.is_done,
  };
}

function toDirection(value: string): TripDirection {
  if (value !== 'outbound' && value !== 'return') {
    throw new OperationsAccessError('load');
  }
  return value;
}

function toReason(value: string | null): ChangeReason | '' {
  if (value === null) {
    return '';
  }
  const reason = (Object.keys(reasonColumns) as ChangeReason[]).find(
    (key) => reasonColumns[key] === value,
  );
  if (!reason) {
    throw new OperationsAccessError('load');
  }
  return reason;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
