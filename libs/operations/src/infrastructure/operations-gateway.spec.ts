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
  arrival_time: '09:00:00',
  customer_id: 'customer-1',
  vehicle_id: null,
  driver_id: 'driver-1',
  is_cancelled: true,
  is_done: false,
  is_extra: false,
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
        arrivalTime: '09:00',
        customerId: 'customer-1',
        vehicleId: '',
        driverId: 'driver-1',
        cancelled: true,
        reason: 'vehicleBreakdown',
        notes: '',
        done: false,
        extra: false,
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
      driverId: 'driver-2',
      cancelled: false,
      reason: 'driverAbsent',
      notes: '  ',
    });

    expect(calls.updated).toEqual({
      vehicle_id: 'vehicle-2',
      driver_id: 'driver-2',
      is_cancelled: false,
      change_reason: 'driver_absent',
      notes: null,
    });
    expect(calls.filters).toEqual([
      ['id', 'trip-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('clears the done mark when a change cancels the trip', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.updateTrip('org-north', 'trip-1', {
      vehicleId: '',
      driverId: '',
      cancelled: true,
      reason: 'vehicleBreakdown',
      notes: '',
    });

    expect(calls.updated).toMatchObject({ is_cancelled: true, is_done: false });
  });

  it('marks a trip done scoped to the trip and its organization', async () => {
    const calls = recorder(() => ({
      data: { ...row, is_cancelled: false, change_reason: null, is_done: true },
      error: null,
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    const trip = await gateway.updateDone('org-north', 'trip-1', true);

    expect(calls.updated).toEqual({ is_done: true });
    expect(calls.filters).toEqual([
      ['id', 'trip-1'],
      ['organization_id', 'org-north'],
    ]);
    expect(trip.done).toBe(true);
  });

  it('reads no recording periods when the organization has not chosen yet', async () => {
    const calls = recorder(() => ({ data: [], error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(gateway.listTripRecordings('org-north')).resolves.toEqual([]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('reads each recording the organization chose with the day it starts', async () => {
    const calls = recorder(() => ({
      data: [
        { starts_on: '2026-09-01', trip_recording: 'automatic' },
        { starts_on: '2026-10-05', trip_recording: 'manual' },
      ],
      error: null,
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(gateway.listTripRecordings('org-north')).resolves.toEqual([
      { startsOn: '2026-09-01', recording: 'automatic' },
      { startsOn: '2026-10-05', recording: 'manual' },
    ]);
  });

  it('saves the recording through the database function for the organization', async () => {
    const calls = recorder(() => ({ data: null, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.saveTripRecording('org-north', 'manual');

    expect(calls.rpc).toEqual([
      [
        'set_trip_recording',
        { p_organization_id: 'org-north', p_trip_recording: 'manual' },
      ],
    ]);
  });

  it('adds an extra trip without a route for the organization', async () => {
    const calls = recorder(() => ({
      data: { ...row, route_id: null, is_extra: true, is_cancelled: false, change_reason: null },
      error: null,
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    const trip = await gateway.insertExtraTrip('org-north', '2026-10-04', {
      routeId: '',
      customerId: 'customer-1',
      direction: 'return',
      departureTime: '21:00',
      arrivalTime: '23:00',
      vehicleId: 'vehicle-1',
      driverId: 'driver-1',
      tripPrice: '250',
      notes: ' Airport ',
    }, 25000);

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      route_id: null,
      service_date: '2026-10-04',
      direction: 'return',
      departure_time: '21:00',
      arrival_time: '23:00',
      customer_id: 'customer-1',
      vehicle_id: 'vehicle-1',
      driver_id: 'driver-1',
      trip_price: 25000,
      notes: 'Airport',
      is_extra: true,
    });
    expect(trip).toMatchObject({ routeId: '', extra: true });
  });

  it('deletes a trip of the organization through remove_daily_trip', async () => {
    const calls = recorder(() => ({ data: null, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.deleteTrip('org-north', 'trip-9');

    expect(calls.rpc).toEqual([
      [
        'remove_daily_trip',
        { p_organization_id: 'org-north', p_trip_id: 'trip-9' },
      ],
    ]);
  });

  it('reports a failure when remove_daily_trip fails', async () => {
    const calls = recorder(() => ({
      data: null,
      error: { message: 'not_found' },
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(gateway.deleteTrip('org-north', 'trip-1')).rejects.toEqual(
      new OperationsAccessError('save'),
    );
  });

  it('lists trip omissions for the day', async () => {
    const calls = recorder(() => ({
      data: [
        {
          route_id: 'route-1',
          service_date: '2026-10-15',
          direction: 'outbound',
        },
      ],
      error: null,
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(
      gateway.listTripOmissions('org-north', '2026-10-15'),
    ).resolves.toEqual([
      {
        routeId: 'route-1',
        serviceDate: '2026-10-15',
        direction: 'outbound',
      },
    ]);
  });

  it('restores an omitted trip through restore_omitted_trip', async () => {
    const calls = recorder(() => ({ data: 'trip-9', error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.restoreOmittedTrip('org-north', {
      routeId: 'route-1',
      serviceDate: '2026-10-15',
      direction: 'return',
    });

    expect(calls.rpc).toEqual([
      [
        'restore_omitted_trip',
        {
          p_organization_id: 'org-north',
          p_route_id: 'route-1',
          p_service_date: '2026-10-15',
          p_direction: 'return',
        },
      ],
    ]);
  });

  it('refuses a cancellation without a reason before calling the database', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(
      gateway.updateTrip('org-north', 'trip-1', {
        vehicleId: '',
        driverId: 'driver-1',
        cancelled: true,
        reason: '',
        notes: '',
      }),
    ).rejects.toEqual(new OperationsAccessError('reason'));
    expect(calls.updated).toBeNull();
  });

  it('clears the reason when a cancelled trip is put back to running', async () => {
    const calls = recorder(() => ({
      data: { ...row, is_cancelled: false, change_reason: null },
      error: null,
    }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.updateTrip('org-north', 'trip-1', {
      vehicleId: 'vehicle-1',
      driverId: 'driver-1',
      cancelled: false,
      reason: '',
      notes: '',
    });

    expect(calls.updated).toEqual({
      vehicle_id: 'vehicle-1',
      driver_id: 'driver-1',
      is_cancelled: false,
      change_reason: null,
      notes: null,
    });
  });

  it('cancels the chosen customers trips of the day as a holiday', async () => {
    const calls = recorder(() => ({ data: null, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await gateway.cancelCustomerTrips('org-north', '2026-10-06', ['delta', 'nour']);

    expect(calls.updated).toEqual({
      is_cancelled: true,
      is_done: false,
      change_reason: 'holiday',
    });
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['service_date', '2026-10-06'],
      ['is_done', false],
    ]);
    expect(calls.inFilters).toEqual([['customer_id', ['delta', 'nour']]]);
  });

  it('adds route trips to past days and returns how many were added', async () => {
    const calls = recorder(() => ({ data: 14, error: null }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(
      gateway.addRouteTrips('org-north', ['route-1', 'route-2'], {
        from: '2026-10-01',
        to: '2026-10-11',
      }),
    ).resolves.toBe(14);
    expect(calls.rpc).toEqual([
      [
        'add_route_trips',
        {
          p_organization_id: 'org-north',
          p_route_ids: ['route-1', 'route-2'],
          p_from: '2026-10-01',
          p_to: '2026-10-11',
        },
      ],
    ]);
  });

  it('turns the database codes for route trips into problems', async () => {
    const calls = recorder(() => ({ data: null, error: { message: 'past_days' } }));
    const gateway = new SupabaseOperationsGateway(calls.client);

    await expect(
      gateway.addRouteTrips('org-north', ['route-1'], {
        from: '2026-10-01',
        to: '2026-10-12',
      }),
    ).rejects.toEqual(new OperationsAccessError('pastDays'));
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
  const filters: [string, unknown][] = [];
  const inFilters: [string, string[]][] = [];
  const rpc: [string, unknown][] = [];
  let updated: unknown = null;
  let inserted: unknown = null;
  let deleted = false;
  const query = {
    select: () => query,
    update: (value: unknown) => {
      updated = value;
      return query;
    },
    insert: (value: unknown) => {
      inserted = value;
      return query;
    },
    delete: () => {
      deleted = true;
      return query;
    },
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    then: (
      resolve: (value: Result) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result()).then(resolve, reject),
    in: (column: string, values: string[]) => {
      inFilters.push([column, values]);
      return Promise.resolve(result());
    },
    order: () => Promise.resolve(result()),
    single: () => Promise.resolve(result()),
    maybeSingle: () => Promise.resolve(result()),
  };
  return {
    filters,
    inFilters,
    rpc,
    get updated() {
      return updated;
    },
    get inserted() {
      return inserted;
    },
    get deleted() {
      return deleted;
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
