import { SupabaseClient } from '@supabase/supabase-js';
import { ReportsAccessError } from '../application/reports-access-error';
import { Database } from './database';
import { SupabaseReportsGateway } from './reports-gateway';

type Result = { data: unknown; error: { message: string } | null };

describe('SupabaseReportsGateway', () => {
  it('counts the month through the database function for the organization', async () => {
    const calls = recorder(() => ({
      data: [
        {
          customer_id: 'delta',
          vehicle_id: 'bus-1',
          driver_id: null,
          done_trips: 22,
          extra_trips: 1,
          revenue: 315000,
          unpriced_trips: 1,
        },
      ],
      error: null,
    }));
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(
      gateway.tripCounts(
        'org-north',
        { from: '2026-10-01', to: '2026-10-31' },
        '2026-10-04',
      ),
    ).resolves.toEqual([
      {
        customerId: 'delta',
        vehicleId: 'bus-1',
        driverId: '',
        done: 22,
        extra: 1,
        revenue: 315000,
        unpriced: 1,
      },
    ]);
    expect(calls.rpc).toEqual([
      [
        'trip_report',
        {
          p_organization_id: 'org-north',
          p_from: '2026-10-01',
          p_to: '2026-10-31',
          p_today: '2026-10-04',
        },
      ],
    ]);
  });

  it('lists the days nobody opened', async () => {
    const calls = recorder(() => ({ data: ['2026-10-02'], error: null }));
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(
      gateway.unopenedDays('org-north', { from: '2026-10-01', to: '2026-10-04' }),
    ).resolves.toEqual(['2026-10-02']);
    expect(calls.rpc).toEqual([
      [
        'unopened_days',
        { p_organization_id: 'org-north', p_from: '2026-10-01', p_to: '2026-10-04' },
      ],
    ]);
  });

  it('names vehicles with their ownership and keeps every record of the organization', async () => {
    const calls = recorder((table) => {
      if (table === 'vehicles') {
        return {
          data: [
            { id: 'van-2', plate_number: 'X 2', ownership: 'rented', owner_name: 'مكتب النور' },
          ],
          error: null,
        };
      }
      if (table === 'customers') {
        return { data: [{ id: 'delta', name: 'Delta Factory' }], error: null };
      }
      return { data: [{ id: 'ahmed', full_name: 'Ahmed' }], error: null };
    });
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(gateway.listChoices('org-north')).resolves.toEqual({
      customers: [{ id: 'delta', label: 'Delta Factory' }],
      vehicles: [
        { id: 'van-2', label: 'X 2', ownership: 'rented', ownerName: 'مكتب النور' },
      ],
      drivers: [{ id: 'ahmed', label: 'Ahmed' }],
    });
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('replaces a database error with a safe code', async () => {
    const calls = recorder(() => ({ data: null, error: { message: 'permission denied' } }));
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(
      gateway.tripCounts('org-north', { from: '2026-10-01', to: '2026-10-31' }, '2026-10-04'),
    ).rejects.toEqual(new ReportsAccessError('load'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseReportsGateway(null);

    await expect(gateway.listChoices('org-north')).rejects.toEqual(
      new ReportsAccessError('notConnected'),
    );
  });
});

function recorder(respond: (table: string) => Result) {
  const filters: [string, string][] = [];
  const rpc: [string, unknown][] = [];
  const query = (table: string) => {
    const chain = {
      select: () => chain,
      eq: (column: string, value: string) => {
        filters.push([column, value]);
        return chain;
      },
      then: (resolve: (result: Result) => unknown) => resolve(respond(table)),
    };
    return chain;
  };
  return {
    filters,
    rpc,
    client: {
      from: (table: string) => query(table),
      rpc: (name: string, args: unknown) => {
        rpc.push([name, args]);
        return Promise.resolve(respond(name));
      },
    } as unknown as SupabaseClient<Database>,
  };
}
