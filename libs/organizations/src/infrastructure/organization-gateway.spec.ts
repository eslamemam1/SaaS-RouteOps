import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationAccessError } from '../application/organization-access-error';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { Database } from './database';
import { SupabaseOrganizationGateway } from './organization-gateway';

describe('SupabaseOrganizationGateway', () => {
  it('requests memberships for the signed-in user id', async () => {
    const filters: { column: string; value: string }[] = [];
    const client = fakeClient({
      onEq(column, value) {
        filters.push({ column, value });
        return { data: [{ organization_id: 'org-north' }], error: null };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.membershipOrganizationIds('user-1')).resolves.toEqual([
      'org-north',
    ]);
    expect(filters).toEqual([{ column: 'user_id', value: 'user-1' }]);
  });

  it('replaces a database error with a safe message', async () => {
    const client = fakeClient({
      onEq() {
        return {
          data: null,
          error: { message: 'relation "organizations" does not exist' },
        };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.membershipOrganizationIds('user-1')).rejects.toEqual(
      new OrganizationAccessError('load'),
    );
  });

  it('maps organization rows to id, name, and currency', async () => {
    const client = fakeClient({
      onIn() {
        return {
          data: [
            { id: 'org-north', name: 'North', currency: 'SAR', is_active: false, extra: 'hidden' },
          ],
          error: null,
        };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.organizationsByIds(['org-north'])).resolves.toEqual([
      { id: 'org-north', name: 'North', currency: 'SAR', isActive: false },
    ]);
  });

  it('lists the company accounts the database returns to the operator', async () => {
    const calls: string[] = [];
    const client = fakeClient({
      onRpc(name) {
        calls.push(name);
        return {
          data: [
            {
              organization_id: 'org-gulf',
              organization_name: 'Gulf',
              currency: 'SAR',
              is_active: true,
              created_at: '2026-10-01T09:00:00Z',
              login_ids: ['login-gulf'],
              login_emails: ['gulf@example.com'],
              last_sign_in_at: null,
            },
            {
              organization_id: 'org-old',
              organization_name: 'Old',
              currency: 'XYZ',
              is_active: false,
              created_at: '2026-01-01T09:00:00Z',
              login_ids: [],
              login_emails: [],
              last_sign_in_at: '2026-02-01T09:00:00Z',
            },
          ],
          error: null,
        };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.companyAccounts()).resolves.toEqual([
      {
        id: 'org-gulf',
        name: 'Gulf',
        currency: 'SAR',
        isActive: true,
        logins: [{ id: 'login-gulf', email: 'gulf@example.com' }],
        createdAt: '2026-10-01T09:00:00Z',
        lastSignInAt: null,
      },
      {
        id: 'org-old',
        name: 'Old',
        currency: 'EGP',
        isActive: false,
        logins: [],
        createdAt: '2026-01-01T09:00:00Z',
        lastSignInAt: '2026-02-01T09:00:00Z',
      },
    ]);
    expect(calls).toEqual(['operator_accounts']);
  });

  it('asks the database to stop or turn on one account', async () => {
    const calls: { name: string; args?: Record<string, unknown> }[] = [];
    const client = fakeClient({
      onRpc(name, args) {
        calls.push({ name, args });
        return { data: null, error: null };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await gateway.setOrganizationActive('org-gulf', false);

    expect(calls).toEqual([
      {
        name: 'set_organization_active',
        args: { p_organization_id: 'org-gulf', p_is_active: false },
      },
    ]);
  });

  it('replaces an error changing an account with a safe message', async () => {
    const client = fakeClient({
      onRpc() {
        return {
          data: null,
          error: { message: 'only the site operator can change an account' },
        };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.setOrganizationActive('org-gulf', true)).rejects.toEqual(
      new OrganizationAccessError('accountStatus'),
    );
  });

  it('sums the month and today for the dashboard under the reports rules', async () => {
    const calls: { name: string; args?: Record<string, unknown> }[] = [];
    const rows: Record<string, unknown[]> = {
      expense_totals: [{ total: 150000 }, { total: 50000 }],
      unopened_days: ['2026-10-04', '2026-10-08'],
      driver_pay: [
        driverPay({ pay_type: 'salary', monthly_salary: 500000 }),
        driverPay({ pay_type: 'salary', monthly_salary: 700000, recorded: 700000 }),
        driverPay({ pay_type: 'per_trip', outbound_pay: 10000, return_pay: 10000 }),
        driverPay({
          pay_type: 'per_trip',
          outbound_pay: 10000,
          return_pay: 10000,
          done_outbound: 3,
          recorded: 10000,
        }),
      ],
      vehicle_pay: [
        vehiclePay({ rent_type: 'monthly', monthly_rent: 300000 }),
        vehiclePay({ rent_type: 'per_trip', outbound_rent: 20000, return_rent: 20000 }),
      ],
    };
    const client = fakeClient({
      onEq(column, value) {
        return column === 'service_date' && value === '2026-10-08'
          ? { data: [{ is_cancelled: false }, { is_cancelled: true }], error: null }
          : { data: [], error: null };
      },
      onRpc(name, args) {
        calls.push({ name, args });
        if (name === 'trip_report') {
          return args?.['p_from'] === '2026-10-08'
            ? { data: [{ done_trips: 1, revenue: 5000, unpriced_trips: 0 }], error: null }
            : {
                data: [
                  { done_trips: 20, revenue: 100000, unpriced_trips: 2 },
                  { done_trips: 5, revenue: 25000, unpriced_trips: 0 },
                ],
                error: null,
              };
        }
        return { data: rows[name] ?? [], error: null };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    const facts = await gateway.dashboardFacts(
      'org-north',
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-08',
      { from: '2026-09-01', to: '2026-09-30' },
    );

    expect(facts).toEqual({
      todayTrips: [{ cancelled: false }, { cancelled: true }],
      todayDone: 1,
      monthDone: 25,
      monthRevenue: 125000,
      monthUnpriced: 2,
      monthExpenses: 200000,
      unopenedDays: ['2026-10-04', '2026-10-08'],
      unrecordedDriverPay: 2,
      unrecordedVehiclePay: 1,
      setup: { customers: 2, drivers: 2, routes: 2 },
    });
    expect(calls).toContainEqual({
      name: 'driver_pay',
      args: {
        p_organization_id: 'org-north',
        p_from: '2026-09-01',
        p_to: '2026-09-30',
        p_today: '2026-10-08',
      },
    });
    expect(calls).toContainEqual({
      name: 'unopened_days',
      args: { p_organization_id: 'org-north', p_from: '2026-10-01', p_to: '2026-10-08' },
    });
  });

  it('replaces an error loading the dashboard with a safe message', async () => {
    const client = fakeClient({
      onRpc(name) {
        return name === 'expense_totals'
          ? { data: null, error: { message: 'permission denied' } }
          : { data: [], error: null };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(
      gateway.dashboardFacts(
        'org-north',
        { from: '2026-10-01', to: '2026-10-31' },
        '2026-10-08',
        { from: '2026-09-01', to: '2026-09-30' },
      ),
    ).rejects.toEqual(new OrganizationAccessError('load'));
  });

  it('replaces an error listing the accounts with a safe message', async () => {
    const client = fakeClient({
      onRpc() {
        return { data: null, error: { message: 'permission denied' } };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.companyAccounts()).rejects.toEqual(
      new OrganizationAccessError('load'),
    );
  });
});

function fakeClient(handlers: {
  onEq?: (
    column: string,
    value: string,
  ) => { data: unknown; error: { message: string } | null };
  onIn?: (
    column: string,
    value: readonly string[],
  ) => { data: unknown; error: { message: string } | null };
  onRpc?: (
    name: string,
    args?: Record<string, unknown>,
  ) => { data: unknown; error: { message: string } | null };
}): SupabaseClient<Database> {
  const query = {
    select() {
      return query;
    },
    eq(column: string, value: string) {
      const result = (name: string, current: string) =>
        Promise.resolve({
          count: 2,
          ...(handlers.onEq?.(name, current) ?? { data: [], error: null }),
        });
      return Object.assign(result(column, value), { eq: result });
    },
    in(column: string, value: readonly string[]) {
      return Promise.resolve(
        handlers.onIn?.(column, value) ?? { data: [], error: null },
      );
    },
  };
  return {
    from() {
      return query;
    },
    rpc(name: string, args?: Record<string, unknown>) {
      const result = Promise.resolve(
        handlers.onRpc?.(name, args) ?? { data: [], error: null },
      );
      const page = Object.assign(result, {
        order: () => page,
        range: () => result,
      });
      return page;
    },
  } as unknown as SupabaseClient<Database>;
}

describe('SupabaseOrganizationGateway subscription payments', () => {
  const row = {
    id: 'payment-1',
    organization_id: 'org-gulf',
    paid_on: '2026-10-03',
    covers_month: '2026-10-01',
    amount: 150000,
    note: null,
  };

  it('reads each payment with the month it covers', async () => {
    const gateway = new SupabaseOrganizationGateway(
      paymentClient({ list: { data: [row], error: null } }).client,
    );

    await expect(gateway.subscriptionPayments()).resolves.toEqual([
      {
        id: 'payment-1',
        organizationId: 'org-gulf',
        paidOn: '2026-10-03',
        coversMonth: '2026-10',
        amount: 150000,
        note: '',
      },
    ]);
  });

  it('stores the month as its first day and a blank note as none', async () => {
    const fake = paymentClient({ inserted: { data: row, error: null } });
    const gateway = new SupabaseOrganizationGateway(fake.client);

    await gateway.insertSubscriptionPayment({
      organizationId: 'org-gulf',
      paidOn: '2026-10-03',
      coversMonth: '2026-10',
      amount: 150000,
      note: '   ',
    });

    expect(fake.inserts).toEqual([
      {
        organization_id: 'org-gulf',
        paid_on: '2026-10-03',
        covers_month: '2026-10-01',
        amount: 150000,
        note: null,
      },
    ]);
  });

  it('reports a payment it could not delete, such as one already gone', async () => {
    const gateway = new SupabaseOrganizationGateway(
      paymentClient({ deleted: { data: [], error: null } }).client,
    );

    await expect(gateway.deleteSubscriptionPayment('payment-1')).rejects.toEqual(
      new SubscriptionPaymentError('remove'),
    );
  });

  it('replaces a database error with a safe code', async () => {
    const gateway = new SupabaseOrganizationGateway(
      paymentClient({ list: { data: null, error: { message: 'permission denied' } } }).client,
    );

    await expect(gateway.subscriptionPayments()).rejects.toEqual(
      new SubscriptionPaymentError('load'),
    );
  });

  it('asks the server to set a login password and keeps its error code', async () => {
    const fake = paymentClient({
      invoked: {
        error: { context: new Response(JSON.stringify({ error: 'login' }), { status: 400 }) },
      },
    });
    const gateway = new SupabaseOrganizationGateway(fake.client);

    await expect(gateway.setLoginPassword('login-gulf', 'secret1')).rejects.toEqual(
      new OrganizationAccessError('login'),
    );
    expect(fake.invocations).toEqual([
      { name: 'set-company-password', body: { loginId: 'login-gulf', password: 'secret1' } },
    ]);
  });

  it('falls back to a general password problem when the server says nothing', async () => {
    const gateway = new SupabaseOrganizationGateway(
      paymentClient({ invoked: { error: new Error('network') } }).client,
    );

    await expect(gateway.setLoginPassword('login-gulf', 'secret1')).rejects.toEqual(
      new OrganizationAccessError('passwordChange'),
    );
  });
});

type Result = { data: unknown; error: { message: string } | null };

function paymentClient(results: {
  list?: Result;
  inserted?: Result;
  deleted?: Result;
  invoked?: { error: unknown };
}) {
  const inserts: unknown[] = [];
  const invocations: { name: string; body: unknown }[] = [];
  const empty: Result = { data: [], error: null };
  const client = {
    from() {
      return {
        select() {
          return { order: () => Promise.resolve(results.list ?? empty) };
        },
        insert(values: unknown) {
          inserts.push(values);
          return {
            select: () => ({ single: () => Promise.resolve(results.inserted ?? empty) }),
          };
        },
        delete() {
          return {
            eq: () => ({ select: () => Promise.resolve(results.deleted ?? empty) }),
          };
        },
      };
    },
    functions: {
      invoke(name: string, options: { body: unknown }) {
        invocations.push({ name, body: options.body });
        return Promise.resolve({ data: null, error: results.invoked?.error ?? null });
      },
    },
  } as unknown as SupabaseClient<Database>;
  return { client, inserts, invocations };
}

function driverPay(row: Record<string, unknown>) {
  return {
    driver_id: 'driver',
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
    vehicle_id: 'vehicle',
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
