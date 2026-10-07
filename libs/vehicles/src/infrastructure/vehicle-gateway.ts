import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from '@routeops/shared/money';
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
import { Database } from './database';

export interface VehicleGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<VehicleOrganization[]>;
  listVehicles(organization: VehicleOrganization): Promise<Vehicle[]>;
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

const rentTypeColumns: Record<RentType, string> = {
  none: 'none',
  monthly: 'monthly',
  perTrip: 'per_trip',
};

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
      throw new VehicleAccessError(saveProblem(error));
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
      throw new VehicleAccessError(saveProblem(error));
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

function saveProblem(error: PostgrestError | null) {
  return error?.code === uniqueViolation ? 'plateTaken' : 'save';
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
