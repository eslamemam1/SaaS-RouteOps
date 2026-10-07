import { SupabaseClient } from '@supabase/supabase-js';
import { ExpenseAccessError } from '../application/expense-access-error';
import { emptyExpenseDetails, ExpenseOrganization } from '../domain/expense';
import { Database } from './database';
import { SupabaseExpenseGateway } from './expense-gateway';

interface Result {
  data: unknown;
  error: { message: string; code?: string } | null;
}

const north: ExpenseOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
const row = {
  id: 'expense-1',
  spent_on: '2026-10-03',
  category: 'fuel',
  amount: 25050,
  vehicle_id: 'vehicle-1',
  driver_id: null,
  description: null,
};
const fuel = {
  ...emptyExpenseDetails('2026-10-03'),
  category: 'fuel',
  amount: '٢٥٠.٥',
  vehicleId: 'vehicle-1',
};

describe('SupabaseExpenseGateway', () => {
  it('lists the expenses of an organization between two days', async () => {
    const calls = recorder({ data: [row], error: null });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await expect(
      gateway.listExpenses('org-north', { from: '2026-10-01', to: '2026-10-31' }),
    ).resolves.toEqual([
      {
        id: 'expense-1',
        spentOn: '2026-10-03',
        category: 'fuel',
        amount: 25050,
        vehicleId: 'vehicle-1',
        driverId: '',
        description: '',
      },
    ]);
    expect(calls.filters).toEqual([
      ['eq', 'organization_id', 'org-north'],
      ['gte', 'spent_on', '2026-10-01'],
      ['lte', 'spent_on', '2026-10-31'],
    ]);
  });

  it('stores the amount in the smallest unit of the currency', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await gateway.insertExpense(north, { ...fuel, description: '  ' });

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      spent_on: '2026-10-03',
      category: 'fuel',
      amount: 25050,
      vehicle_id: 'vehicle-1',
      driver_id: null,
      description: null,
    });
  });

  it('refuses an amount that is not above zero before saving', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await expect(
      gateway.insertExpense(north, { ...fuel, amount: '0' }),
    ).rejects.toEqual(new ExpenseAccessError('amount'));
    expect(calls.inserted).toBeNull();
  });

  it('scopes an update to the expense and its organization', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await gateway.updateExpense(north, 'expense-1', fuel);

    expect(calls.filters).toEqual([
      ['eq', 'id', 'expense-1'],
      ['eq', 'organization_id', 'org-north'],
    ]);
  });

  it('reports a delete that removed nothing', async () => {
    const calls = recorder({ data: [], error: null });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await expect(gateway.deleteExpense('org-north', 'expense-1')).rejects.toEqual(
      new ExpenseAccessError('remove'),
    );
    expect(calls.filters).toEqual([
      ['eq', 'id', 'expense-1'],
      ['eq', 'organization_id', 'org-north'],
    ]);
  });

  it('replaces a database error with a safe code', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'new row violates row-level security policy', code: '42501' },
    });
    const gateway = new SupabaseExpenseGateway(calls.client);

    await expect(gateway.insertExpense(north, fuel)).rejects.toEqual(
      new ExpenseAccessError('save'),
    );
  });

  it('reads the drivers pay for a month', async () => {
    const rpc = vi.fn(async () => ({
      data: [
        {
          driver_id: 'driver-1',
          pay_type: 'salary',
          monthly_salary: 300000,
          salary_trips: 26,
          outbound_pay: 5000,
          return_pay: 4000,
          done_outbound: 30,
          done_return: 24,
          absent_outbound: 0,
          absent_return: 2,
          recorded: 20000,
        },
        {
          driver_id: 'driver-2',
          pay_type: 'per_trip',
          monthly_salary: null,
          salary_trips: null,
          outbound_pay: 6000,
          return_pay: 4000,
          done_outbound: 2,
          done_return: 2,
          absent_outbound: 0,
          absent_return: 0,
          recorded: 0,
        },
      ],
      error: null,
    }));
    const gateway = new SupabaseExpenseGateway({
      rpc,
    } as unknown as SupabaseClient<Database>);

    await expect(
      gateway.driverPay('org-north', { from: '2026-10-01', to: '2026-10-31' }, '2026-10-05'),
    ).resolves.toEqual([
      {
        driverId: 'driver-1',
        payType: 'salary',
        monthlySalary: 300000,
        salaryTrips: 26,
        tripPay: { outbound: 5000, return: 4000 },
        done: { outbound: 30, return: 24 },
        absent: { outbound: 0, return: 2 },
        recorded: 20000,
      },
      {
        driverId: 'driver-2',
        payType: 'perTrip',
        monthlySalary: null,
        salaryTrips: null,
        tripPay: { outbound: 6000, return: 4000 },
        done: { outbound: 2, return: 2 },
        absent: { outbound: 0, return: 0 },
        recorded: 0,
      },
    ]);
    expect(rpc).toHaveBeenCalledWith('driver_pay', {
      p_organization_id: 'org-north',
      p_from: '2026-10-01',
      p_to: '2026-10-31',
      p_today: '2026-10-05',
    });
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseExpenseGateway(null);

    await expect(
      gateway.listExpenses('org-north', { from: '2026-10-01', to: '2026-10-31' }),
    ).rejects.toEqual(new ExpenseAccessError('notConnected'));
  });
});

function recorder(result: Result) {
  const filters: [string, string, string][] = [];
  let inserted: unknown = null;
  const query = {
    select: () => query,
    insert: (value: unknown) => {
      inserted = value;
      return query;
    },
    update: () => query,
    delete: () => query,
    eq: (column: string, value: string) => {
      filters.push(['eq', column, value]);
      return query;
    },
    gte: (column: string, value: string) => {
      filters.push(['gte', column, value]);
      return query;
    },
    lte: (column: string, value: string) => {
      filters.push(['lte', column, value]);
      return query;
    },
    order: () => query,
    single: () => Promise.resolve(result),
    then: (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return {
    filters,
    get inserted() {
      return inserted;
    },
    client: { from: () => query } as unknown as SupabaseClient<Database>,
  };
}
