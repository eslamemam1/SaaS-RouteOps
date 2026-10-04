import { SupabaseClient } from '@supabase/supabase-js';
import { DriverAccessError } from '../application/driver-access-error';
import { emptyDriverDetails } from '../domain/driver';
import { Database } from './database';
import { SupabaseDriverGateway } from './driver-gateway';

type Result = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

const row = {
  id: 'driver-1',
  full_name: 'أحمد محمد',
  phone: '0100',
  national_id: null,
  license_number: null,
  license_expires_on: '2027-01-31',
  notes: null,
  is_active: true,
};

describe('SupabaseDriverGateway', () => {
  it('filters the driver list by organization and maps empty columns to blank text', async () => {
    const calls = recorder({ data: [row], error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(gateway.listDrivers('org-north')).resolves.toEqual([
      {
        id: 'driver-1',
        fullName: 'أحمد محمد',
        phone: '0100',
        nationalId: '',
        licenseNumber: '',
        licenseExpiry: '2027-01-31',
        notes: '',
        active: true,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('trims the name, normalizes the national ID, and stores blanks as null', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.insertDriver('org-north', {
      ...emptyDriverDetails,
      fullName: '  أحمد محمد ',
      nationalId: '٢٩٠ ٠١٠١',
      phone: '  ',
    });

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      full_name: 'أحمد محمد',
      phone: null,
      national_id: '2900101',
      license_number: null,
      license_expires_on: null,
      notes: null,
      is_active: true,
    });
  });

  it('scopes an update to the driver and its organization', async () => {
    const calls = recorder({ data: { ...row, is_active: false }, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.updateDriver('org-north', 'driver-1', {
      ...emptyDriverDetails,
      fullName: 'أحمد محمد',
      active: false,
    });

    expect(calls.filters).toEqual([
      ['id', 'driver-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('reports a national ID already used in the organization', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'duplicate key value', code: '23505' },
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.insertDriver('org-north', {
        ...emptyDriverDetails,
        fullName: 'أحمد',
        nationalId: '2900101',
      }),
    ).rejects.toEqual(new DriverAccessError('nationalIdTaken'));
  });

  it('replaces any other database error with a safe code', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'new row violates row-level security policy', code: '42501' },
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.insertDriver('org-south', { ...emptyDriverDetails, fullName: 'X' }),
    ).rejects.toEqual(new DriverAccessError('save'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseDriverGateway(null);

    await expect(gateway.listDrivers('org-north')).rejects.toEqual(
      new DriverAccessError('notConnected'),
    );
  });
});

function recorder(result: Result) {
  const filters: [string, string][] = [];
  let inserted: unknown = null;
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
