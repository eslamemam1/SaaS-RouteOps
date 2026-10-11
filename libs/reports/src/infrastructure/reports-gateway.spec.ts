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
          route_id: null,
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
        routeId: '',
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

  it('totals the month expenses per category, vehicle, and driver', async () => {
    const calls = recorder(() => ({
      data: [
        { category: 'fuel', vehicle_id: 'bus-1', driver_id: null, total: 80000 },
        { category: 'salaries', vehicle_id: null, driver_id: 'ahmed', total: 500000 },
      ],
      error: null,
    }));
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(
      gateway.expenseTotals('org-north', { from: '2026-10-01', to: '2026-10-31' }),
    ).resolves.toEqual([
      { category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 80000 },
      { category: 'salaries', vehicleId: '', driverId: 'ahmed', total: 500000 },
    ]);
    expect(calls.rpc).toEqual([
      [
        'expense_totals',
        { p_organization_id: 'org-north', p_from: '2026-10-01', p_to: '2026-10-31' },
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
      if (table === 'routes') {
        return { data: [{ id: 'route-1', name: 'Line 1', customer_id: 'delta' }], error: null };
      }
      return { data: [{ id: 'ahmed', full_name: 'Ahmed' }], error: null };
    });
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(gateway.listChoices('org-north')).resolves.toEqual({
      customers: [{ id: 'delta', label: 'Delta Factory' }],
      routes: [{ id: 'route-1', label: 'Line 1', customerId: 'delta' }],
      vehicles: [
        { id: 'van-2', label: 'X 2', ownership: 'rented', ownerName: 'مكتب النور' },
      ],
      drivers: [{ id: 'ahmed', label: 'Ahmed' }],
    });
    expect(calls.filters).toEqual([
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('counts the drivers and vehicles with pay still due, even partly recorded', async () => {
    const perTrip = { outbound_pay: 10000, return_pay: 10000 };
    const calls = recorder((name) =>
      name === 'driver_pay'
        ? {
            data: [
              driverPay({ driver_id: 'ahmed', pay_type: 'salary', monthly_salary: 500000 }),
              driverPay({ driver_id: 'karim', pay_type: 'per_trip', ...perTrip }),
              driverPay({ driver_id: 'samy', pay_type: 'per_trip', ...perTrip, done_outbound: 3, recorded: 10000 }),
              driverPay({ driver_id: 'omar', pay_type: 'salary', monthly_salary: 500000, recorded: 500000 }),
            ],
            error: null,
          }
        : {
            data: [
              vehiclePay({ vehicle_id: 'van-2', rent_type: 'monthly', monthly_rent: 300000 }),
              vehiclePay({ vehicle_id: 'van-3', rent_type: 'per_trip', outbound_rent: 5000, return_rent: 5000 }),
            ],
            error: null,
          },
    );
    const gateway = new SupabaseReportsGateway(calls.client);

    await expect(
      gateway.unrecordedPay('org-north', { from: '2026-10-01', to: '2026-10-31' }, '2026-10-04'),
    ).resolves.toEqual({ drivers: 2, vehicles: 1 });
    expect(calls.rpc.map(([name]) => name)).toEqual(['driver_pay', 'vehicle_pay']);
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
        const result = Promise.resolve(respond(name));
        const page = Object.assign(result, {
          order: () => page,
          range: () => result,
        });
        return page;
      },
    } as unknown as SupabaseClient<Database>,
  };
}

function driverPay(row: Record<string, unknown>) {
  return {
    monthly_salary: null,
    salary_trips: null,
    outbound_pay: null,
    return_pay: null,
    done_outbound: 0,
    done_return: 0,
    absent_outbound: 0,
    absent_return: 0,
    recorded: 0,
    ...row,
  };
}

function vehiclePay(row: Record<string, unknown>) {
  return {
    ownership: 'rented',
    monthly_rent: null,
    outbound_rent: null,
    return_rent: null,
    done_outbound: 0,
    done_return: 0,
    recorded: 0,
    ...row,
  };
}
