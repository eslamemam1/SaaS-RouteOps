import { SupabaseClient } from '@supabase/supabase-js';
import { RouteAccessError } from '../application/route-access-error';
import { emptyTransportRouteDetails } from '../domain/transport-route';
import { Database } from './database';
import { SupabaseRouteGateway } from './route-gateway';

type Result = { data: unknown; error: { message: string } | null };

const row = {
  id: 'route-1',
  name: 'Delta - Nasr City',
  customer_id: 'customer-1',
  vehicle_id: null,
  driver_id: 'driver-1',
  start_point: 'Hegaz Square',
  end_point: 'Delta Factory',
  outbound_time: '07:00:00',
  return_time: null,
  operating_days: [0, 1, 2, 3, 4, 6],
  notes: null,
  is_active: true,
};

describe('SupabaseRouteGateway', () => {
  it('filters routes by organization and maps days and times for the form', async () => {
    const calls = recorder(() => ({ data: [row], error: null }));
    const gateway = new SupabaseRouteGateway(calls.client);

    const [route] = await gateway.listRoutes('org-north');

    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
    expect(route.vehicleId).toBe('');
    expect(route.outboundTime).toBe('07:00');
    expect(route.returnTime).toBe('');
    expect(route.days).toEqual({
      saturday: true,
      sunday: true,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: false,
    });
  });

  it('stores unset choices and times as null and days as sorted day numbers', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseRouteGateway(calls.client);

    await gateway.insertRoute('org-north', {
      ...emptyTransportRouteDetails,
      name: ' Delta - Nasr City ',
      customerId: 'customer-1',
      driverId: 'driver-1',
      startPoint: 'Hegaz Square',
      endPoint: 'Delta Factory',
      outboundTime: '07:00',
    });

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      name: 'Delta - Nasr City',
      customer_id: 'customer-1',
      vehicle_id: null,
      driver_id: 'driver-1',
      start_point: 'Hegaz Square',
      end_point: 'Delta Factory',
      outbound_time: '07:00',
      return_time: null,
      operating_days: [0, 1, 2, 3, 4, 6],
      notes: null,
      is_active: true,
    });
  });

  it('loads customers, vehicles, and drivers of the organization as choices', async () => {
    const calls = recorder((table) => ({
      data:
        table === 'customers'
          ? [{ id: 'customer-1', name: 'Delta', is_active: true }]
          : table === 'vehicles'
            ? [{ id: 'vehicle-1', plate_number: 'ABC 1', is_active: false }]
            : [{ id: 'driver-1', full_name: 'Ahmed', is_active: true }],
      error: null,
    }));
    const gateway = new SupabaseRouteGateway(calls.client);

    await expect(gateway.listChoices('org-north')).resolves.toEqual({
      customers: [{ id: 'customer-1', label: 'Delta', active: true }],
      vehicles: [{ id: 'vehicle-1', label: 'ABC 1', active: false }],
      drivers: [{ id: 'driver-1', label: 'Ahmed', active: true }],
    });
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('scopes an update to the route and its organization', async () => {
    const calls = recorder(() => ({ data: row, error: null }));
    const gateway = new SupabaseRouteGateway(calls.client);

    await gateway.updateRoute('org-north', 'route-1', {
      ...emptyTransportRouteDetails,
      name: 'Delta',
      customerId: 'customer-1',
      startPoint: 'A',
      endPoint: 'B',
      returnTime: '16:00',
    });

    expect(calls.filters).toEqual([
      ['id', 'route-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('replaces a database error with a safe code', async () => {
    const calls = recorder(() => ({
      data: null,
      error: { message: 'violates foreign key constraint "routes_customer_fkey"' },
    }));
    const gateway = new SupabaseRouteGateway(calls.client);

    await expect(
      gateway.insertRoute('org-north', {
        ...emptyTransportRouteDetails,
        name: 'X',
        customerId: 'customer-of-another-organization',
        startPoint: 'A',
        endPoint: 'B',
        outboundTime: '07:00',
      }),
    ).rejects.toEqual(new RouteAccessError('save'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseRouteGateway(null);

    await expect(gateway.listRoutes('org-north')).rejects.toEqual(
      new RouteAccessError('notConnected'),
    );
  });
});

function recorder(result: (table: string) => Result) {
  const filters: [string, string][] = [];
  let inserted: unknown = null;
  const queryFor = (table: string) => {
    const query = {
      select: () => query,
      insert: (value: unknown) => {
        inserted = value;
        return query;
      },
      update: () => query,
      eq: (column: string, value: string) => {
        filters.push([column, value]);
        return query;
      },
      order: () => Promise.resolve(result(table)),
      single: () => Promise.resolve(result(table)),
    };
    return query;
  };
  return {
    filters,
    get inserted() {
      return inserted;
    },
    client: { from: queryFor } as unknown as SupabaseClient<Database>,
  };
}
