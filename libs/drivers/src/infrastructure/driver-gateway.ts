import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toAmountText,
  toMinorUnits,
} from '@routeops/shared/money';
import { DriverPay, toDriverPay } from '@routeops/shared/pay';
import { allRows } from '@routeops/shared/supabase';
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
import {
  ChangeReason,
  DateRange,
  DriverRoute,
  DriverTrip,
  isTripDirection,
  isTripStatus,
  WorkChoices,
} from '../domain/driver-month';
import { Database } from './database';

export interface DriverGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<DriverOrganization[]>;
  listDrivers(organization: DriverOrganization): Promise<Driver[]>;
  findDriver(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<Driver | null>;
  workChoices(organizationId: string): Promise<WorkChoices>;
  driverRoutes(organizationId: string, driverId: string): Promise<DriverRoute[]>;
  tripLog(
    organizationId: string,
    driverId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverTrip[]>;
  driverPay(
    organizationId: string,
    driverId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverPay | null>;
  unopenedDays(organizationId: string, range: DateRange): Promise<string[]>;
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

const reasonColumns: Record<ChangeReason, string> = {
  holiday: 'holiday',
  vehicleBreakdown: 'vehicle_breakdown',
  driverAbsent: 'driver_absent',
  customerRequest: 'customer_request',
  other: 'other',
};

type TripLogRow = Database['public']['Functions']['trip_log']['Returns'][number];

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

  async findDriver(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<Driver | null> {
    const { data, error } = await this.requireClient()
      .from('drivers')
      .select(driverColumns)
      .eq('organization_id', organization.id)
      .eq('id', driverId)
      .maybeSingle();
    if (error) {
      throw new DriverAccessError('load');
    }
    if (!data) {
      return null;
    }
    const [driver] = await this.toDrivers([data], organization.currency);
    return driver;
  }

  // Inactive records stay, because past trips may still use them.
  async workChoices(organizationId: string): Promise<WorkChoices> {
    const client = this.requireClient();
    const [customers, routes, vehicles, drivers] = await Promise.all([
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
          .select('id, name, customer_id')
          .eq('organization_id', organizationId)
          .order('id')
          .range(from, to),
      ),
      allRows((from, to) =>
        client
          .from('vehicles')
          .select('id, plate_number')
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
    if (customers.error || routes.error || vehicles.error || drivers.error) {
      throw new DriverAccessError('load');
    }
    return {
      customers: (customers.data ?? []).map((row) => ({ id: row.id, label: row.name })),
      routes: (routes.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        customerId: row.customer_id,
      })),
      vehicles: (vehicles.data ?? []).map((row) => ({
        id: row.id,
        label: row.plate_number,
      })),
      drivers: (drivers.data ?? []).map((row) => ({ id: row.id, label: row.full_name })),
    };
  }

  async driverRoutes(
    organizationId: string,
    driverId: string,
  ): Promise<DriverRoute[]> {
    const { data, error } = await this.requireClient()
      .from('routes')
      .select('id, name, customer_id, vehicle_id, outbound_time, return_time')
      .eq('organization_id', organizationId)
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .order('name');
    if (error) {
      throw new DriverAccessError('load');
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id ?? '',
      outboundTime: row.outbound_time?.slice(0, 5) ?? '',
      returnTime: row.return_time?.slice(0, 5) ?? '',
    }));
  }

  async tripLog(
    organizationId: string,
    driverId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverTrip[]> {
    const client = this.requireClient();
    const { data, error } = await allRows((from, to) =>
      client
        .rpc('trip_log', {
          p_organization_id: organizationId,
          p_from: range.from,
          p_to: range.to,
          p_today: today,
          p_driver_id: driverId,
        })
        .order('service_date')
        .order('departure_time')
        .order('id')
        .range(from, to),
    );
    if (error) {
      throw new DriverAccessError('load');
    }
    return (data ?? []).map(toTrip);
  }

  async driverPay(
    organizationId: string,
    driverId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverPay | null> {
    const { data, error } = await this.requireClient()
      .rpc('driver_pay', {
        p_organization_id: organizationId,
        p_from: range.from,
        p_to: range.to,
        p_today: today,
      })
      .eq('driver_id', driverId);
    if (error) {
      throw new DriverAccessError('load');
    }
    const [row] = data ?? [];
    return row ? toDriverPay(row) : null;
  }

  async unopenedDays(organizationId: string, range: DateRange): Promise<string[]> {
    const { data, error } = await this.requireClient().rpc('unopened_days', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
    });
    if (error) {
      throw new DriverAccessError('load');
    }
    return data ?? [];
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

function toTrip(row: TripLogRow): DriverTrip {
  if (!isTripDirection(row.direction) || !isTripStatus(row.status)) {
    throw new DriverAccessError('load');
  }
  return {
    id: row.id,
    serviceDate: row.service_date,
    departureTime: row.departure_time.slice(0, 5),
    direction: row.direction,
    customerId: row.customer_id,
    routeId: row.route_id ?? '',
    vehicleId: row.vehicle_id ?? '',
    driverId: row.driver_id,
    plannedDriverId: row.planned_driver_id ?? '',
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
    throw new DriverAccessError('load');
  }
  return reason;
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
