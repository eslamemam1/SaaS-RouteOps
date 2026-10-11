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
  DriverPhoto,
  normalizeNationalId,
  PayType,
  toTripCount,
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
  uploadPhoto(path: string, photo: Blob): Promise<void>;
  setPhotoPath(
    organization: DriverOrganization,
    driverId: string,
    path: string | null,
  ): Promise<Driver>;
  deletePhoto(path: string): Promise<void>;
}

type DriverRow = Pick<
  Database['public']['Tables']['drivers']['Row'],
  | 'id'
  | 'full_name'
  | 'phone'
  | 'national_id'
  | 'license_number'
  | 'license_expires_on'
  | 'pay_type'
  | 'monthly_salary'
  | 'salary_trips'
  | 'outbound_pay'
  | 'return_pay'
  | 'notes'
  | 'is_active'
  | 'photo_path'
>;

const driverColumns =
  'id, full_name, phone, national_id, license_number, license_expires_on, pay_type, monthly_salary, salary_trips, outbound_pay, return_pay, notes, is_active, photo_path';

const photoBucket = 'driver-photos';
const photoUrlSeconds = 60 * 60;
const photoCacheSeconds = String(60 * 60 * 24 * 365);

const uniqueViolation = '23505';
// Raised by the database when an active route still uses the driver.
const activeRoutes = 'active_routes';

const payTypeColumns: Record<PayType, string> = {
  none: 'none',
  salary: 'salary',
  perTrip: 'per_trip',
};

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
    return this.toDrivers(data ?? [], organization.currency);
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
      throw saveError(error);
    }
    const [driver] = await this.toDrivers([data], organization.currency);
    return driver;
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
      throw saveError(error);
    }
    const [driver] = await this.toDrivers([data], organization.currency);
    return driver;
  }

  async uploadPhoto(path: string, photo: Blob): Promise<void> {
    const { error } = await this.requireClient()
      .storage.from(photoBucket)
      .upload(path, photo, {
        contentType: photo.type,
        cacheControl: photoCacheSeconds,
        upsert: false,
      });
    if (error) {
      throw new DriverAccessError('save');
    }
  }

  async setPhotoPath(
    organization: DriverOrganization,
    driverId: string,
    path: string | null,
  ): Promise<Driver> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .update({ photo_path: path })
      .eq('id', driverId)
      .eq('organization_id', organization.id)
      .select(driverColumns)
      .single();
    if (error || !data) {
      throw new DriverAccessError('save');
    }
    const [driver] = await this.toDrivers([data], organization.currency);
    return driver;
  }

  // A file left behind costs a few kilobytes; it must not undo a saved change.
  async deletePhoto(path: string): Promise<void> {
    await this.requireClient().storage.from(photoBucket).remove([path]);
  }

  // One request signs every photo of the list. A photo that cannot be signed
  // shows the driver's initials instead.
  private async toDrivers(
    rows: readonly DriverRow[],
    currency: Currency,
  ): Promise<Driver[]> {
    const paths = rows.flatMap((row) =>
      row.photo_path ? [row.photo_path] : [],
    );
    const urls = new Map<string, string>();
    if (paths.length > 0) {
      const { data } = await this.requireClient()
        .storage.from(photoBucket)
        .createSignedUrls(paths, photoUrlSeconds);
      for (const signed of data ?? []) {
        if (signed.path && signed.signedUrl) {
          urls.set(signed.path, signed.signedUrl);
        }
      }
    }
    return rows.map((row) =>
      toDriver(row, currency, photoOf(row.photo_path, urls)),
    );
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new DriverAccessError('notConnected');
    }
    return this.client;
  }
}

function saveError(error: PostgrestError | null): DriverAccessError {
  if (error?.message === activeRoutes) {
    return new DriverAccessError('activeRoutes', routeNames(error.details));
  }
  return new DriverAccessError(error?.code === uniqueViolation ? 'nationalIdTaken' : 'save');
}

function routeNames(details: string | null | undefined): string[] {
  return (details ?? '').split('\n').filter((name) => name !== '');
}

function photoOf(
  path: string | null,
  urls: ReadonlyMap<string, string>,
): DriverPhoto | null {
  const url = path ? urls.get(path) : undefined;
  return path && url ? { path, url } : null;
}

function toDriver(
  row: DriverRow,
  currency: Currency,
  photo: DriverPhoto | null,
): Driver {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    nationalId: row.national_id ?? '',
    licenseNumber: row.license_number ?? '',
    licenseExpiry: row.license_expires_on ?? '',
    payType: toPayType(row.pay_type),
    monthlySalary: toAmountText(row.monthly_salary, currency),
    salaryTrips: row.salary_trips === null ? '' : String(row.salary_trips),
    outboundPay: toAmountText(row.outbound_pay, currency),
    returnPay: toAmountText(row.return_pay, currency),
    notes: row.notes ?? '',
    active: row.is_active,
    photo,
  };
}

function toColumns(details: DriverDetails, currency: Currency) {
  return {
    full_name: details.fullName.trim(),
    phone: blankToNull(details.phone),
    national_id: blankToNull(normalizeNationalId(details.nationalId)),
    license_number: blankToNull(details.licenseNumber),
    license_expires_on: blankToNull(details.licenseExpiry),
    ...toPayColumns(details, currency),
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function toPayType(column: string): PayType {
  const payType = (Object.keys(payTypeColumns) as PayType[]).find(
    (key) => payTypeColumns[key] === column,
  );
  if (!payType) {
    throw new DriverAccessError('load');
  }
  return payType;
}

// Only the terms of the chosen pay type are kept; the database refuses any
// other combination.
function toPayColumns(details: DriverDetails, currency: Currency) {
  const none = {
    pay_type: payTypeColumns[details.payType],
    monthly_salary: null,
    salary_trips: null,
    outbound_pay: null,
    return_pay: null,
  };
  switch (details.payType) {
    case 'none':
      return none;
    case 'salary': {
      const salaryTrips = toTripCount(details.salaryTrips);
      if (salaryTrips === undefined) {
        throw new DriverAccessError('trips');
      }
      const monthlySalary = requiredAmount(details.monthlySalary, currency);
      return salaryTrips === null
        ? { ...none, monthly_salary: monthlySalary }
        : {
            ...none,
            monthly_salary: monthlySalary,
            salary_trips: salaryTrips,
            outbound_pay: requiredAmount(details.outboundPay, currency),
            return_pay: requiredAmount(details.returnPay, currency),
          };
    }
    case 'perTrip':
      return {
        ...none,
        outbound_pay: requiredAmount(details.outboundPay, currency),
        return_pay: requiredAmount(details.returnPay, currency),
      };
  }
}

function requiredAmount(text: string, currency: Currency): number {
  const minor = toMinorUnits(text, currency);
  if (minor === null) {
    throw new DriverAccessError('required');
  }
  if (minor === undefined) {
    throw new DriverAccessError('amount');
  }
  return minor;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
