import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationAccessError } from '../application/organization-access-error';
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
              login_emails: ['gulf@example.com'],
              last_sign_in_at: null,
            },
            {
              organization_id: 'org-old',
              organization_name: 'Old',
              currency: 'XYZ',
              is_active: false,
              created_at: '2026-01-01T09:00:00Z',
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
        logins: ['gulf@example.com'],
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
        { pay_type: 'salary', done_outbound: 0, done_return: 0, recorded: 0 },
        { pay_type: 'salary', done_outbound: 10, done_return: 10, recorded: 700000 },
        { pay_type: 'perTrip', done_outbound: 0, done_return: 0, recorded: 0 },
        { pay_type: 'perTrip', done_outbound: 3, done_return: 0, recorded: 0 },
      ],
      vehicle_pay: [
        { rent_type: 'monthly', done_outbound: 0, done_return: 0, recorded: 0 },
        { rent_type: 'perTrip', done_outbound: 0, done_return: 0, recorded: 0 },
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
      gateway.dashboardFacts('org-north', { from: '2026-10-01', to: '2026-10-31' }, '2026-10-08'),
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
        Promise.resolve(handlers.onEq?.(name, current) ?? { data: [], error: null });
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
      return Promise.resolve(
        handlers.onRpc?.(name, args) ?? { data: [], error: null },
      );
    },
  } as unknown as SupabaseClient<Database>;
}
