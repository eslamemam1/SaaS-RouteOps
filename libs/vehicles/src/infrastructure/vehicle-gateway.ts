import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from '@routeops/shared/money';
import { toVehiclePay, VehiclePay } from '@routeops/shared/pay';
import { allRows } from '@routeops/shared/supabase';
import { VehicleAccessError } from '../application/vehicle-access-error';
import {
  effectiveRentType,
  isVehicleOwnership,
  RentType,
  isVehicleType,
  normalizePlate,
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
  wholeNumber,
} from '../domain/vehicle';
import {
  byCategory,
  CategoryTotal,
  ChangeReason,
  DateRange,
  isExpenseCategory,
  isTripDirection,
  isTripStatus,
  VehicleRoute,
  VehicleTrip,
  WorkChoices,
} from '../domain/vehicle-month';
import { Database } from './database';

export interface VehicleGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<VehicleOrganization[]>;
  listVehicles(organization: VehicleOrganization): Promise<Vehicle[]>;
  findVehicle(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<Vehicle | null>;
  workChoices(organizationId: string): Promise<WorkChoices>;
  vehicleRoutes(organizationId: string, vehicleId: string): Promise<VehicleRoute[]>;
  tripLog(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
    today: string,
  ): Promise<VehicleTrip[]>;
  vehiclePay(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
    today: string,
  ): Promise<VehiclePay | null>;
  vehicleExpenses(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
  ): Promise<CategoryTotal[]>;
  unopenedDays(organizationId: string, range: DateRange): Promise<string[]>;
  insertVehicle(
    organization: VehicleOrganization,
    details: VehicleDetails,
  ): Promise<Vehicle>;
  updateVehicle(
    organization: VehicleOrganization,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle>;
}

type VehicleRow = Pick<
  Database['public']['Tables']['vehicles']['Row'],
  | 'id'
  | 'plate_number'
  | 'vehicle_type'
  | 'model'
  | 'model_year'
  | 'seats'
  | 'license_expires_on'
  | 'ownership'
  | 'owner_name'
  | 'owner_phone'
  | 'rent_type'
  | 'monthly_rent'
  | 'outbound_rent'
  | 'return_rent'
  | 'notes'
  | 'is_active'
>;

const vehicleColumns =
  'id, plate_number, vehicle_type, model, model_year, seats, license_expires_on, ownership, owner_name, owner_phone, rent_type, monthly_rent, outbound_rent, return_rent, notes, is_active';

const uniqueViolation = '23505';
// Raised by the database when an active route still uses the vehicle.
const activeRoutes = 'active_routes';
// Raised by the database when the company's plan allows no more active vehicles.
const vehicleLimit = 'vehicle_limit';

const rentTypeColumns: Record<RentType, string> = {
  none: 'none',
  monthly: 'monthly',
  perTrip: 'per_trip',
};

const reasonColumns: Record<ChangeReason, string> = {
  holiday: 'holiday',
  vehicleBreakdown: 'vehicle_breakdown',
  driverAbsent: 'driver_absent',
  customerRequest: 'customer_request',
  other: 'other',
};

type TripLogRow = Database['public']['Functions']['trip_log']['Returns'][number];

export class SupabaseVehicleGateway implements VehicleGateway {
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
  ): Promise<VehicleOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name, currency)')
      .eq('user_id', userId);
    if (error) {
      throw new VehicleAccessError('load');
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

  async listVehicles(organization: VehicleOrganization): Promise<Vehicle[]> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .select(vehicleColumns)
      .eq('organization_id', organization.id)
      .order('plate_number');
    if (error) {
      throw new VehicleAccessError('load');
    }
    return (data ?? []).map((row) => toVehicle(row, organization.currency));
  }

  async findVehicle(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<Vehicle | null> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .select(vehicleColumns)
      .eq('organization_id', organization.id)
      .eq('id', vehicleId)
      .maybeSingle();
    if (error) {
      throw new VehicleAccessError('load');
    }
    return data ? toVehicle(data, organization.currency) : null;
  }

  // Inactive records stay, because past trips may still use them.
  async workChoices(organizationId: string): Promise<WorkChoices> {
    const client = this.requireClient();
    const [customers, routes, drivers] = await Promise.all([
      allRows((from, to) =>
        client
          .from('customers')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('id')
          .range(from, to),
      ),
      allRows((from, to) =>
        client
          .from('routes')
          .select('id, name')
          .eq('organization_id', organizationId)
          .order('id')
          .range(from, to),
      ),
      allRows((from, to) =>
        client
          .from('drivers')
          .select('id, full_name')
          .eq('organization_id', organizationId)
          .order('id')
          .range(from, to),
      ),
    ]);
    if (customers.error || routes.error || drivers.error) {
      throw new VehicleAccessError('load');
    }
    return {
      customers: (customers.data ?? []).map((row) => ({ id: row.id, label: row.name })),
      routes: (routes.data ?? []).map((row) => ({ id: row.id, label: row.name })),
      drivers: (drivers.data ?? []).map((row) => ({ id: row.id, label: row.full_name })),
    };
  }

  async vehicleRoutes(
    organizationId: string,
    vehicleId: string,
  ): Promise<VehicleRoute[]> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .select('id, name, customer_id, driver_id, outbound_time, return_time')
      .eq('organization_id', organizationId)
      .eq('vehicle_id', vehicleId)
      .eq('is_active', true)
      .order('name');
    if (error) {
      throw new VehicleAccessError('load');
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      customerId: row.customer_id,
      driverId: row.driver_id ?? '',
      outboundTime: row.outbound_time?.slice(0, 5) ?? '',
      returnTime: row.return_time?.slice(0, 5) ?? '',
    }));
  }

  async tripLog(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
    today: string,
  ): Promise<VehicleTrip[]> {
    const client = this.requireClient();
    const { data, error } = await allRows((from, to) =>
      client
        .rpc('trip_log', {
          p_organization_id: organizationId,
          p_from: range.from,
          p_to: range.to,
          p_today: today,
          p_vehicle_id: vehicleId,
        })
        .order('service_date')
        .order('departure_time')
        .order('id')
        .range(from, to),
    );
    if (error) {
      throw new VehicleAccessError('load');
    }
    return (data ?? []).map(toTrip);
  }

  async vehiclePay(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
    today: string,
  ): Promise<VehiclePay | null> {
    const { data, error } = await this.requireClient()
      .rpc('vehicle_pay', {
        p_organization_id: organizationId,
        p_from: range.from,
        p_to: range.to,
        p_today: today,
      })
      .eq('vehicle_id', vehicleId);
    if (error) {
      throw new VehicleAccessError('load');
    }
    const [row] = data ?? [];
    return row ? toVehiclePay(row) : null;
  }

  async vehicleExpenses(
    organizationId: string,
    vehicleId: string,
    range: DateRange,
  ): Promise<CategoryTotal[]> {
    const { data, error } = await this.requireClient()
      .rpc('expense_totals', {
        p_organization_id: organizationId,
        p_from: range.from,
        p_to: range.to,
      })
      .eq('vehicle_id', vehicleId);
    if (error) {
      throw new VehicleAccessError('load');
    }
    return byCategory(
      (data ?? []).flatMap((row) =>
        isExpenseCategory(row.category)
          ? [{ category: row.category, total: Number(row.total) }]
          : [],
      ),
    );
  }

  async unopenedDays(organizationId: string, range: DateRange): Promise<string[]> {
    const { data, error } = await this.requireClient().rpc('unopened_days', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
    });
    if (error) {
      throw new VehicleAccessError('load');
    }
    return data ?? [];
  }

  async insertVehicle(
    organization: VehicleOrganization,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .insert({
        organization_id: organization.id,
        ...toColumns(details, organization.currency),
      })
      .select(vehicleColumns)
      .single();
    if (error || !data) {
      throw saveError(error);
    }
    return toVehicle(data, organization.currency);
  }

  async updateVehicle(
    organization: VehicleOrganization,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .update(toColumns(details, organization.currency))
      .eq('id', vehicleId)
      .eq('organization_id', organization.id)
      .select(vehicleColumns)
      .single();
    if (error || !data) {
      throw saveError(error);
    }
    return toVehicle(data, organization.currency);
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new VehicleAccessError('notConnected');
    }
    return this.client;
  }
}

function saveError(error: PostgrestError | null): VehicleAccessError {
  if (error?.message === activeRoutes) {
    return new VehicleAccessError('activeRoutes', routeNames(error.details));
  }
  if (error?.message === vehicleLimit) {
    return new VehicleAccessError('vehicleLimit');
  }
  return new VehicleAccessError(error?.code === uniqueViolation ? 'plateTaken' : 'save');
}

function toTrip(row: TripLogRow): VehicleTrip {
  if (!isTripDirection(row.direction) || !isTripStatus(row.status)) {
    throw new VehicleAccessError('load');
  }
  return {
    id: row.id,
    serviceDate: row.service_date,
    departureTime: row.departure_time.slice(0, 5),
    direction: row.direction,
    customerId: row.customer_id,
    routeId: row.route_id ?? '',
    driverId: row.driver_id,
    extra: row.is_extra,
    status: row.status,
    reason: toReason(row.change_reason),
    notes: row.notes ?? '',
    price: row.price === null ? null : Number(row.price),
    halves: row.halves,
  };
}

function toReason(value: string | null): ChangeReason | '' {
  if (value === null) {
    return '';
  }
  const reason = (Object.keys(reasonColumns) as ChangeReason[]).find(
    (key) => reasonColumns[key] === value,
  );
  if (!reason) {
    throw new VehicleAccessError('load');
  }
  return reason;
}

function routeNames(details: string | null | undefined): string[] {
  return (details ?? '').split('\n').filter((name) => name !== '');
}

function toVehicle(row: VehicleRow, currency: Currency): Vehicle {
  if (!isVehicleType(row.vehicle_type) || !isVehicleOwnership(row.ownership)) {
    throw new VehicleAccessError('load');
  }
  return {
    id: row.id,
    plateNumber: row.plate_number,
    type: row.vehicle_type,
    model: row.model ?? '',
    year: row.model_year === null ? '' : String(row.model_year),
    seats: row.seats === null ? '' : String(row.seats),
    licenseExpiry: row.license_expires_on ?? '',
    ownership: row.ownership,
    ownerName: row.owner_name ?? '',
    ownerPhone: row.owner_phone ?? '',
    rentType: toRentType(row.rent_type),
    monthlyRent: toAmountText(row.monthly_rent, currency),
    outboundRent: toAmountText(row.outbound_rent, currency),
    returnRent: toAmountText(row.return_rent, currency),
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: VehicleDetails, currency: Currency) {
  if (!isVehicleType(details.type)) {
    throw new VehicleAccessError('type');
  }
  const owned = details.ownership === 'owned';
  return {
    plate_number: normalizePlate(details.plateNumber),
    vehicle_type: details.type,
    model: blankToNull(details.model),
    model_year: wholeNumber(details.year),
    seats: wholeNumber(details.seats),
    license_expires_on: blankToNull(details.licenseExpiry),
    ownership: details.ownership,
    owner_name: owned ? null : blankToNull(details.ownerName),
    owner_phone: owned ? null : blankToNull(details.ownerPhone),
    ...toRentColumns(details, currency),
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function toRentType(column: string): RentType {
  switch (column) {
    case 'none':
      return 'none';
    case 'monthly':
      return 'monthly';
    case 'per_trip':
      return 'perTrip';
    default:
      throw new VehicleAccessError('load');
  }
}

function toRentColumns(details: VehicleDetails, currency: Currency) {
  const rentType = effectiveRentType(details.ownership, details.rentType);
  const none = {
    rent_type: rentTypeColumns[rentType],
    monthly_rent: null,
    outbound_rent: null,
    return_rent: null,
  };
  switch (rentType) {
    case 'none':
      return none;
    case 'monthly':
      return { ...none, monthly_rent: requiredAmount(details.monthlyRent, currency) };
    case 'perTrip':
      return {
        ...none,
        outbound_rent: requiredAmount(details.outboundRent, currency),
        return_rent: requiredAmount(details.returnRent, currency),
      };
  }
}

function requiredAmount(text: string, currency: Currency): number {
  const minor = toMinorUnits(text, currency);
  if (minor === null) {
    throw new VehicleAccessError('required');
  }
  if (minor === undefined) {
    throw new VehicleAccessError('amount');
  }
  return minor;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
