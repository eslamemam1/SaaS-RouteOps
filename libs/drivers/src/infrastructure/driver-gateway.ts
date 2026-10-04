import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { DriverAccessError } from '../application/driver-access-error';
import {
  Driver,
  DriverDetails,
  DriverOrganization,
  normalizeNationalId,
} from '../domain/driver';
import { Database } from './database';

export interface DriverGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<DriverOrganization[]>;
  listDrivers(organizationId: string): Promise<Driver[]>;
  insertDriver(organizationId: string, details: DriverDetails): Promise<Driver>;
  updateDriver(
    organizationId: string,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver>;
}

type DriverRow = Pick<
  Database['public']['Tables']['drivers']['Row'],
  | 'id'
  | 'full_name'
  | 'phone'
  | 'national_id'
  | 'license_number'
  | 'license_expires_on'
  | 'notes'
  | 'is_active'
>;

const driverColumns =
  'id, full_name, phone, national_id, license_number, license_expires_on, notes, is_active';

const uniqueViolation = '23505';

export class SupabaseDriverGateway implements DriverGateway {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  async membershipOrganizations(userId: string): Promise<DriverOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name)')
      .eq('user_id', userId);
    if (error) {
      throw new DriverAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [{ id: row.organizations.id, name: row.organizations.name }]
        : [],
    );
  }

  async listDrivers(organizationId: string): Promise<Driver[]> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .select(driverColumns)
      .eq('organization_id', organizationId)
      .order('full_name');
    if (error) {
      throw new DriverAccessError('load');
    }
    return (data ?? []).map(toDriver);
  }

  async insertDriver(
    organizationId: string,
    details: DriverDetails,
  ): Promise<Driver> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .insert({ organization_id: organizationId, ...toColumns(details) })
      .select(driverColumns)
      .single();
    if (error || !data) {
      throw new DriverAccessError(saveProblem(error));
    }
    return toDriver(data);
  }

  async updateDriver(
    organizationId: string,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .update(toColumns(details))
      .eq('id', driverId)
      .eq('organization_id', organizationId)
      .select(driverColumns)
      .single();
    if (error || !data) {
      throw new DriverAccessError(saveProblem(error));
    }
    return toDriver(data);
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new DriverAccessError('notConnected');
    }
    return this.client;
  }
}

function saveProblem(error: PostgrestError | null) {
  return error?.code === uniqueViolation ? 'nationalIdTaken' : 'save';
}

function toDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    nationalId: row.national_id ?? '',
    licenseNumber: row.license_number ?? '',
    licenseExpiry: row.license_expires_on ?? '',
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: DriverDetails) {
  return {
    full_name: details.fullName.trim(),
    phone: blankToNull(details.phone),
    national_id: blankToNull(normalizeNationalId(details.nationalId)),
    license_number: blankToNull(details.licenseNumber),
    license_expires_on: blankToNull(details.licenseExpiry),
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
