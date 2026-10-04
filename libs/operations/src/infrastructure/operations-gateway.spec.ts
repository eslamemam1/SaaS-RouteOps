import { SupabaseClient } from '@supabase/supabase-js';
import { OperationsAccessError } from '../application/operations-access-error';
import { Database } from './database';
import { SupabaseOperationsGateway } from './operations-gateway';

type Result = { data: unknown; error: { message: string } | null };

const row = {
  id: 'trip-1',
  route_id: 'route-1',
  service_date: '2026-10-04',
  direction: 'outbound',
  departure_time: '07:00:00',
  customer_id: 'customer-1',
  vehicle_id: null,
  driver_id: 'driver-1',
  is_cancelled: true,
  change_reason: 'vehicle_breakdown',
  notes: null,
};

describe('SupabaseOperationsGateway', () => {
  it('prepares the day through the database function for the organization', async () => {
    const calls = recorder(() => ({ data: null, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.prepareDay('org-north', '2026-10-04');

    expect(calls.rpc).toEqual([
      [
        'prepare_daily_trips',
        { p_organization_id: 'org-north', p_service_date: '2026-10-04' },
      ],
    ]);
  });

  it('lists the day trips of the organization and maps reasons and times', async () => {
    const calls = recorder(() => ({ data: [row], error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(gateway.listTrips('org-north', '2026-10-04')).resolves.toEqual([
      {
        id: 'trip-1',
        routeId: 'route-1',
        serviceDate: '2026-10-04',
        direction: 'outbound',
        departureTime: '07:00',
        customerId: 'customer-1',
        vehicleId: '',
        driverId: 'driver-1',
        cancelled: true,
        reason: 'vehicleBreakdown',
        notes: '',
      },
    ]);
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['service_date', '2026-10-04'],
    ]);
  });

  it('saves a one-day change scoped to the trip and its organization', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.updateTrip('org-north', 'trip-1', {
      vehicleId: 'vehicle-2',
      driverId: '',
      cancelled: false,
      reason: 'driverAbsent',
      notes: '  ',
    });

    expect(calls.updated).toEqual({
      vehicle_id: 'vehicle-2',
      driver_id: null,
      is_cancelled: false,
      change_reason: 'driver_absent',
      notes: null,
    });
    expect(calls.filters).toEqual([
      ['id', 'trip-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('refuses a change without a reason before calling the database', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(
      gateway.updateTrip('org-north', 'trip-1', {
        vehicleId: '',
        driverId: '',
        cancelled: true,
        reason: '',
        notes: '',
      }),
    ).rejects.toEqual(new OperationsAccessError('reason'));
    expect(calls.updated).toBeNull();
  });

  it('cancels the chosen customers trips of the day as a holiday', async () => {
    const calls = recorder(() => ({ data: null, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.cancelCustomerTrips('org-north', '2026-10-06', ['delta', 'nour']);

    expect(calls.updated).toEqual({ is_cancelled: true, change_reason: 'holiday' });
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['service_date', '2026-10-06'],
    ]);
    expect(calls.inFilters).toEqual([['customer_id', ['delta', 'nour']]]);
  });

  it('replaces a database error with a safe code', async () => {
    const calls = recorder(() => ({
      data: null,
      error: { message: 'new row violates row-level security policy' },
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(gateway.prepareDay('org-south', '2026-10-04')).rejects.toEqual(
      new OperationsAccessError('load'),
    );
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseOperationsGateway(null);

    await expect(gateway.listTrips('org-north', '2026-10-04')).rejects.toEqual(
      new OperationsAccessError('notConnected'),
    );
  });
});

function recorder(result: () => Result) {
  const filters: [string, string][] = [];
  const inFilters: [string, string[]][] = [];
  const rpc: [string, unknown][] = [];
  let updated: unknown = null;
  const query = {
    select: () => query,
    update: (value: unknown) => {
      updated = value;
      return query;
    },
    eq: (column: string, value: string) => {
      filters.push([column, value]);
      return query;
    },
    in: (column: string, values: string[]) => {
      inFilters.push([column, values]);
      return Promise.resolve(result());
    },
    order: () => Promise.resolve(result()),
    single: () => Promise.resolve(result()),
  };
  return {
    filters,
    inFilters,
    rpc,
    get updated() {
      return updated;
    },
    client: {
      from: () => query,
      rpc: (name: string, args: unknown) => {
        rpc.push([name, args]);
        return Promise.resolve(result());
      },
    } as unknown as SupabaseClient<Database>,
  };
}
