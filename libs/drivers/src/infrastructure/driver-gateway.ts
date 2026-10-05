import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from '@routeops/shared/money';
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
  listDrivers(organization: DriverOrganization): Promise<Driver[]>;
  insertDriver(
    organization: DriverOrganization,
    details: DriverDetails,
  ): Promise<Driver>;
  updateDriver(
    organization: DriverOrganization,
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
  | 'monthly_salary'
  | 'trip_pay'
  | 'notes'
  | 'is_active'
>;

const driverColumns =
  'id, full_name, phone, national_id, license_number, license_expires_on, monthly_salary, trip_pay, notes, is_active';

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
      .select('organizations(id, name, currency)')
      .eq('user_id', userId);
    if (error) {
      throw new DriverAccessError('load');
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

  async listDrivers(organization: DriverOrganization): Promise<Driver[]> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .select(driverColumns)
      .eq('organization_id', organization.id)
      .order('full_name');
    if (error) {
      throw new DriverAccessError('load');
    }
    return (data ?? []).map((row) => toDriver(row, organization.currency));
  }

  async insertDriver(
    organization: DriverOrganization,
    details: DriverDetails,
  ): Promise<Driver> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .insert({
        organization_id: organization.id,
        ...toColumns(details, organization.currency),
      })
      .select(driverColumns)
      .single();
    if (error || !data) {
      throw new DriverAccessError(saveProblem(error));
    }
    return toDriver(data, organization.currency);
  }

  async updateDriver(
    organization: DriverOrganization,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .update(toColumns(details, organization.currency))
      .eq('id', driverId)
      .eq('organization_id', organization.id)
      .select(driverColumns)
      .single();
    if (error || !data) {
      throw new DriverAccessError(saveProblem(error));
    }
    return toDriver(data, organization.currency);
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

function toDriver(row: DriverRow, currency: Currency): Driver {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    nationalId: row.national_id ?? '',
    licenseNumber: row.license_number ?? '',
    licenseExpiry: row.license_expires_on ?? '',
    monthlySalary: toAmountText(row.monthly_salary, currency),
    tripPay: toAmountText(row.trip_pay, currency),
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: DriverDetails, currency: Currency) {
  return {
    full_name: details.fullName.trim(),
    phone: blankToNull(details.phone),
    national_id: blankToNull(normalizeNationalId(details.nationalId)),
    license_number: blankToNull(details.licenseNumber),
    license_expires_on: blankToNull(details.licenseExpiry),
    monthly_salary: toPay(details.monthlySalary, currency),
    trip_pay: toPay(details.tripPay, currency),
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function toPay(text: string, currency: Currency): number | null {
  const minor = toMinorUnits(text, currency);
  if (minor === undefined) {
    throw new DriverAccessError('amount');
  }
  return minor;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
