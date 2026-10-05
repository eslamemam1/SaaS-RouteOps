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

  it('maps organization rows to id and name', async () => {
    const client = fakeClient({
      onIn() {
        return {
          data: [{ id: 'org-north', name: 'North', extra: 'hidden' }],
          error: null,
        };
      },
    });
    const gateway = new SupabaseOrganizationGateway(client);

    await expect(gateway.organizationsByIds(['org-north'])).resolves.toEqual([
      { id: 'org-north', name: 'North' },
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
              created_at: '2026-10-01T09:00:00Z',
              login_emails: ['gulf@example.com'],
              last_sign_in_at: null,
            },
            {
              organization_id: 'org-old',
              organization_name: 'Old',
              currency: 'XYZ',
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
        logins: ['gulf@example.com'],
        createdAt: '2026-10-01T09:00:00Z',
        lastSignInAt: null,
      },
      {
        id: 'org-old',
        name: 'Old',
        currency: 'EGP',
        logins: [],
        createdAt: '2026-01-01T09:00:00Z',
        lastSignInAt: '2026-02-01T09:00:00Z',
      },
    ]);
    expect(calls).toEqual(['operator_accounts']);
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
  onRpc?: (name: string) => { data: unknown; error: { message: string } | null };
}): SupabaseClient<Database> {
  const query = {
    select() {
      return query;
    },
    eq(column: string, value: string) {
      return Promise.resolve(
        handlers.onEq?.(column, value) ?? { data: [], error: null },
      );
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
    rpc(name: string) {
      return Promise.resolve(
        handlers.onRpc?.(name) ?? { data: [], error: null },
      );
    },
  } as unknown as SupabaseClient<Database>;
}
