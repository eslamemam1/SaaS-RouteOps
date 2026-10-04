import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerAccessError } from '../application/customer-access-error';
import { customerMessages, emptyCustomerDetails } from '../domain/customer';
import { SupabaseCustomerGateway } from './customer-gateway';
import { Database } from './database';

type Result = { data: unknown; error: { message: string } | null };

describe('SupabaseCustomerGateway', () => {
  it('filters the customer list by organization and maps empty columns to blank text', async () => {
    const calls = recorder({
      data: [
        {
          id: 'customer-1',
          name: 'Delta Factory',
          contact_name: null,
          phone: '0100',
          email: null,
          address: null,
          notes: null,
          is_active: true,
        },
      ],
      error: null,
    });
    const gateway = new SupabaseCustomerGateway(calls.client);

    await expect(gateway.listCustomers('org-north')).resolves.toEqual([
      {
        id: 'customer-1',
        name: 'Delta Factory',
        contactName: '',
        phone: '0100',
        email: '',
        address: '',
        notes: '',
        active: true,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('stores blank optional fields as null and trims the name', async () => {
    const calls = recorder({
      data: {
        id: 'customer-1',
        name: 'Delta Factory',
        contact_name: null,
        phone: null,
        email: null,
        address: null,
        notes: null,
        is_active: true,
      },
      error: null,
    });
    const gateway = new SupabaseCustomerGateway(calls.client);

    await gateway.insertCustomer('org-north', {
      ...emptyCustomerDetails,
      name: '  Delta Factory ',
      phone: '   ',
    });

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      name: 'Delta Factory',
      contact_name: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
      is_active: true,
    });
  });

  it('scopes an update to the customer and its organization', async () => {
    const calls = recorder({
      data: {
        id: 'customer-1',
        name: 'Delta',
        contact_name: null,
        phone: null,
        email: null,
        address: null,
        notes: null,
        is_active: false,
      },
      error: null,
    });
    const gateway = new SupabaseCustomerGateway(calls.client);

    await gateway.updateCustomer('org-north', 'customer-1', {
      ...emptyCustomerDetails,
      name: 'Delta',
      active: false,
    });

    expect(calls.filters).toEqual([
      ['id', 'customer-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('replaces a database error with a safe message', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'new row violates row-level security policy' },
    });
    const gateway = new SupabaseCustomerGateway(calls.client);

    await expect(
      gateway.insertCustomer('org-south', { ...emptyCustomerDetails, name: 'X' }),
    ).rejects.toEqual(new CustomerAccessError(customerMessages.save));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseCustomerGateway(null);

    await expect(gateway.listCustomers('org-north')).rejects.toEqual(
      new CustomerAccessError(customerMessages.notConnected),
    );
  });
});

function recorder(result: Result) {
  const filters: [string, string][] = [];
  let inserted: unknown = null;
  const query = {
    select: () => query,
    insert: (row: unknown) => {
      inserted = row;
      return query;
    },
    update: () => query,
    eq: (column: string, value: string) => {
      filters.push([column, value]);
      return query;
    },
    order: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
  };
  return {
    filters,
    get inserted() {
      return inserted;
    },
    client: { from: () => query } as unknown as SupabaseClient<Database>,
  };
}
