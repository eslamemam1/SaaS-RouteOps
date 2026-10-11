import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationAccessError } from '../application/notification-access-error';
import { Database } from './database';
import { SupabaseNotificationRepository } from './supabase-notification-repository';

type Result = { data: unknown; error: { message: string } | null };

describe('SupabaseNotificationRepository', () => {
  it('reads the month so far, last month pay, and licenses expiring within 30 days', async () => {
    const calls = recorder({
      trip_log: [
        {
          id: 'trip-1',
          service_date: '2026-10-11',
          departure_time: '07:00:00',
          vehicle_id: null,
          driver_id: 'driver-1',
          status: 'unrecorded',
          price: '5000',
        },
      ],
      unopened_days: ['2026-10-02'],
      driver_pay: [
        {
          driver_id: 'driver-1',
          pay_type: 'per_trip',
          monthly_salary: null,
          salary_trips: null,
          outbound_pay: 100,
          return_pay: 100,
          done_outbound: 2,
          done_return: 0,
          absent_outbound: 0,
          absent_return: 0,
          recorded: 0,
        },
      ],
      vehicle_pay: [],
      drivers: [
        { id: 'driver-1', full_name: 'أحمد', license_expires_on: '2026-10-20' },
      ],
      vehicles: [
        { id: 'vehicle-1', plate_number: 'ABC 123', license_expires_on: null },
      ],
    });
    const repository = new SupabaseNotificationRepository(calls.client);

    const facts = await repository.facts('org-north', '2026-10-11');

    expect(facts).toEqual({
      trips: [
        {
          id: 'trip-1',
          serviceDate: '2026-10-11',
          departureTime: '07:00',
          vehicleId: '',
          driverId: 'driver-1',
          status: 'unrecorded',
          price: 5000,
        },
      ],
      unopenedDays: ['2026-10-02'],
      unrecordedDriverPay: 1,
      unrecordedVehiclePay: 0,
      drivers: [{ id: 'driver-1', name: 'أحمد', licenseExpiry: '2026-10-20' }],
      vehicles: [],
    });
    expect(calls.rpcs.get('trip_log')).toMatchObject({
      p_organization_id: 'org-north',
      p_from: '2026-10-01',
      p_to: '2026-10-11',
    });
    expect(calls.rpcs.get('driver_pay')).toMatchObject({
      p_from: '2026-09-01',
      p_to: '2026-09-30',
    });
    expect(calls.filters.get('drivers')).toEqual([
      ['eq', 'organization_id', 'org-north'],
      ['eq', 'is_active', true],
      ['lte', 'license_expires_on', '2026-11-10'],
    ]);
  });

  it('reports a failed read', async () => {
    const calls = recorder({}, { message: 'boom' });
    const repository = new SupabaseNotificationRepository(calls.client);

    await expect(repository.facts('org-north', '2026-10-11')).rejects.toEqual(
      new NotificationAccessError('load'),
    );
  });

  it('reports that the app is not connected when there is no client', async () => {
    const repository = new SupabaseNotificationRepository(null);

    await expect(repository.facts('org-north', '2026-10-11')).rejects.toEqual(
      new NotificationAccessError('notConnected'),
    );
  });
});

function recorder(
  data: Record<string, unknown>,
  error: Result['error'] = null,
) {
  const rpcs = new Map<string, unknown>();
  const filters = new Map<string, unknown[][]>();
  const result = (name: string): Result => ({
    data: error ? null : (data[name] ?? []),
    error,
  });
  const chain = (name: string) => {
    const done = Promise.resolve(result(name));
    const query = {
      order: () => query,
      range: () => done,
      then: done.then.bind(done),
    };
    return query;
  };
  const table = (name: string) => {
    const done = Promise.resolve(result(name));
    const recorded: unknown[][] = [];
    filters.set(name, recorded);
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        recorded.push(['eq', column, value]);
        return query;
      },
      lte: (column: string, value: unknown) => {
        recorded.push(['lte', column, value]);
        return query;
      },
      order: () => done,
    };
    return query;
  };
  return {
    rpcs,
    filters,
    client: {
      rpc: (name: string, args: unknown) => {
        rpcs.set(name, args);
        return chain(name);
      },
      from: table,
    } as unknown as SupabaseClient<Database>,
  };
}
