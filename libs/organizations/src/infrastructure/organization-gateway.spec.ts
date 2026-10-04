import { SupabaseClient } from '@supabase/supabase-js';
import { companyAccountMessages } from '../domain/company-account';
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
      new OrganizationAccessError(companyAccountMessages.load),
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
  } as unknown as SupabaseClient<Database>;
}
