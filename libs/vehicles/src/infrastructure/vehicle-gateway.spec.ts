import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { emptyVehicleDetails } from '../domain/vehicle';
import { Database } from './database';
import { SupabaseVehicleGateway } from './vehicle-gateway';

type Result = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

const row = {
  id: 'vehicle-1',
  plate_number: 'أ ب ج 1234',
  vehicle_type: 'microbus',
  model: null,
  model_year: 2020,
  seats: null,
  license_expires_on: null,
  notes: null,
  is_active: true,
};

describe('SupabaseVehicleGateway', () => {
  it('filters the vehicle list by organization and maps columns to form text', async () => {
    const calls = recorder({ data: [row], error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await expect(gateway.listVehicles('org-north')).resolves.toEqual([
      {
        id: 'vehicle-1',
        plateNumber: 'أ ب ج 1234',
        type: 'microbus',
        model: '',
        year: '2020',
        seats: '',
        licenseExpiry: '',
        notes: '',
        active: true,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('normalizes the plate, converts numbers, and stores blanks as null', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await gateway.insertVehicle('org-north', {
      ...emptyVehicleDetails,
      plateNumber: '  أ  ب ج 1234 ',
      type: 'microbus',
      year: '٢٠٢٠',
      seats: ' ',
    });

    expect(calls.inserted).toEqual({
      organization_id: 'org-north',
      plate_number: 'أ ب ج 1234',
      vehicle_type: 'microbus',
      model: null,
      model_year: 2020,
      seats: null,
      license_expires_on: null,
      notes: null,
      is_active: true,
    });
  });

  it('scopes an update to the vehicle and its organization', async () => {
    const calls = recorder({ data: { ...row, is_active: false }, error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await gateway.updateVehicle('org-north', 'vehicle-1', {
      ...emptyVehicleDetails,
      plateNumber: 'أ ب ج 1234',
      type: 'microbus',
      active: false,
    });

    expect(calls.filters).toEqual([
      ['id', 'vehicle-1'],
      ['organization_id', 'org-north'],
    ]);
  });

  it('reports a plate already used in the organization', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'duplicate key value', code: '23505' },
    });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await expect(
      gateway.insertVehicle('org-north', {
        ...emptyVehicleDetails,
        plateNumber: 'أ ب ج 1234',
        type: 'bus',
      }),
    ).rejects.toEqual(new VehicleAccessError('plateTaken'));
  });

  it('replaces any other database error with a safe code', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'new row violates row-level security policy', code: '42501' },
    });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await expect(
      gateway.insertVehicle('org-south', {
        ...emptyVehicleDetails,
        plateNumber: 'X 1',
        type: 'bus',
      }),
    ).rejects.toEqual(new VehicleAccessError('save'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseVehicleGateway(null);

    await expect(gateway.listVehicles('org-north')).rejects.toEqual(
      new VehicleAccessError('notConnected'),
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
