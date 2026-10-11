import { allRows } from '@routeops/shared/supabase';
import {
  remainingPay,
  remainingRent,
  toDriverPay,
  toVehiclePay,
} from '@routeops/shared/pay';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationAccessError } from '../application/notification-access-error';
import { NotificationRepository } from '../application/notification-repository';
import {
  addDays,
  isTripStatus,
  LicenseHolder,
  licenseWarningDays,
  LoggedTrip,
  monthDays,
  NotificationFacts,
  previousMonthDays,
} from '../domain/notification';
import { Database } from './database';

type TripLogRow =
  Database['public']['Functions']['trip_log']['Returns'][number];

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  async facts(
    organizationId: string,
    today: string,
  ): Promise<NotificationFacts> {
    const client = this.client;
    if (!client) {
      throw new NotificationAccessError('notConnected');
    }
    const month = monthDays(today);
    const payMonth = previousMonthDays(today);
    const lastLicenseDay = addDays(today, licenseWarningDays);
    const payArgs = {
      p_organization_id: organizationId,
      p_from: payMonth.from,
      p_to: payMonth.to,
      p_today: today,
    };
    const [trips, unopened, driverPay, vehiclePay, drivers, vehicles] =
      await Promise.all([
        allRows((from, to) =>
          client
            .rpc('trip_log', {
              p_organization_id: organizationId,
              p_from: month.from,
              p_to: today,
              p_today: today,
            })
            .order('service_date')
            .order('departure_time')
            .order('id')
            .range(from, to),
        ),
        client.rpc('unopened_days', {
          p_organization_id: organizationId,
          p_from: month.from,
          p_to: today,
        }),
        client.rpc('driver_pay', payArgs),
        client.rpc('vehicle_pay', payArgs),
        client
          .from('drivers')
          .select('id, full_name, license_expires_on')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .lte('license_expires_on', lastLicenseDay)
          .order('license_expires_on'),
        client
          .from('vehicles')
          .select('id, plate_number, license_expires_on')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .lte('license_expires_on', lastLicenseDay)
          .order('license_expires_on'),
      ]);
    if (
      trips.error ||
      unopened.error ||
      driverPay.error ||
      vehiclePay.error ||
      drivers.error ||
      vehicles.error
    ) {
      throw new NotificationAccessError('load');
    }
    return {
      trips: (trips.data ?? []).flatMap(toTrip),
      unopenedDays: unopened.data ?? [],
      unrecordedDriverPay: (driverPay.data ?? []).filter((row) => {
        const pay = toDriverPay(row);
        return pay !== null && remainingPay(pay) > 0;
      }).length,
      unrecordedVehiclePay: (vehiclePay.data ?? []).filter((row) => {
        const rent = toVehiclePay(row);
        return rent !== null && remainingRent(rent) > 0;
      }).length,
      drivers: (drivers.data ?? []).flatMap((row) =>
        license(row.id, row.full_name, row.license_expires_on),
      ),
      vehicles: (vehicles.data ?? []).flatMap((row) =>
        license(row.id, row.plate_number, row.license_expires_on),
      ),
    };
  }
}

function toTrip(row: TripLogRow): LoggedTrip[] {
  if (!isTripStatus(row.status)) {
    return [];
  }
  return [
    {
      id: row.id,
      serviceDate: row.service_date,
      departureTime: row.departure_time.slice(0, 5),
      vehicleId: row.vehicle_id ?? '',
      driverId: row.driver_id,
      status: row.status,
      price: row.price === null ? null : Number(row.price),
    },
  ];
}

function license(
  id: string,
  name: string,
  expiry: string | null,
): LicenseHolder[] {
  return expiry ? [{ id, name, licenseExpiry: expiry }] : [];
}
