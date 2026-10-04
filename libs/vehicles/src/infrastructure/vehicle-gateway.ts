import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { VehicleAccessError } from '../application/vehicle-access-error';
import {
  isVehicleOwnership,
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
  listVehicles(organizationId: string): Promise<Vehicle[]>;
  insertVehicle(
    organizationId: string,
    details: VehicleDetails,
  ): Promise<Vehicle>;
  updateVehicle(
    organizationId: string,
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
  | 'notes'
  | 'is_active'
>;

const vehicleColumns =
  'id, plate_number, vehicle_type, model, model_year, seats, license_expires_on, ownership, owner_name, owner_phone, notes, is_active';

const uniqueViolation = '23505';

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
      .select('organizations(id, name)')
      .eq('user_id', userId);
    if (error) {
      throw new VehicleAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [{ id: row.organizations.id, name: row.organizations.name }]
        : [],
    );
  }

  async listVehicles(organizationId: string): Promise<Vehicle[]> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .select(vehicleColumns)
      .eq('organization_id', organizationId)
      .order('plate_number');
    if (error) {
      throw new VehicleAccessError('load');
    }
    return (data ?? []).map(toVehicle);
  }

  async insertVehicle(
    organizationId: string,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .insert({ organization_id: organizationId, ...toColumns(details) })
      .select(vehicleColumns)
      .single();
    if (error || !data) {
      throw new VehicleAccessError(saveProblem(error));
    }
    return toVehicle(data);
  }

  async updateVehicle(
    organizationId: string,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    const { data, error } = await this.requireClient()
      .from('vehicles')
      .update(toColumns(details))
      .eq('id', vehicleId)
      .eq('organization_id', organizationId)
      .select(vehicleColumns)
      .single();
    if (error || !data) {
      throw new VehicleAccessError(saveProblem(error));
    }
    return toVehicle(data);
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

function toVehicle(row: VehicleRow): Vehicle {
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
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: VehicleDetails) {
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
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
