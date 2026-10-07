import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { emptyVehicleDetails, VehicleOrganization } from '../domain/vehicle';
import { Database } from './database';
import { SupabaseVehicleGateway } from './vehicle-gateway';

type Result = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

const north: VehicleOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
const south: VehicleOrganization = { id: 'org-south', name: 'South', currency: 'EGP' };

const row = {
  id: 'vehicle-1',
  plate_number: 'أ ب ج 1234',
  vehicle_type: 'microbus',
  model: null,
  model_year: 2020,
  seats: null,
  license_expires_on: null,
  ownership: 'owned',
  owner_name: null,
  owner_phone: null,
  rent_type: 'none',
  monthly_rent: null,
  outbound_rent: null,
  return_rent: null,
  notes: null,
  is_active: true,
};

describe('SupabaseVehicleGateway', () => {
  it('filters the vehicle list by organization and maps columns to form text', async () => {
    const calls = recorder({ data: [row], error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await expect(gateway.listVehicles(north)).resolves.toEqual([
      {
        id: 'vehicle-1',
        plateNumber: 'أ ب ج 1234',
        type: 'microbus',
        model: '',
        year: '2020',
        seats: '',
        licenseExpiry: '',
        ownership: 'owned',
        ownerName: '',
        ownerPhone: '',
        rentType: 'none',
        monthlyRent: '',
        outboundRent: '',
        returnRent: '',
        notes: '',
        active: true,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('maps a rented vehicle with its owner', async () => {
    const calls = recorder({
      data: [{ ...row, ownership: 'rented', owner_name: 'مكتب النور', owner_phone: '0100' }],
      error: null,
    });
    const gateway = new SupabaseVehicleGateway(calls.client);

    const [vehicle] = await gateway.listVehicles(north);

    expect(vehicle).toMatchObject({
      ownership: 'rented',
      ownerName: 'مكتب النور',
      ownerPhone: '0100',
    });
  });

  it('rejects an ownership the app does not know', async () => {
    const calls = recorder({ data: [{ ...row, ownership: 'leased' }], error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await expect(gateway.listVehicles(north)).rejects.toEqual(
      new VehicleAccessError('load'),
    );
  });

  it('stores the owner of a contractor vehicle and clears it for a company vehicle', async () => {
    const contractor = recorder({ data: row, error: null });
    await new SupabaseVehicleGateway(contractor.client).insertVehicle(north, {
      ...emptyVehicleDetails,
      plateNumber: 'X 1',
      type: 'bus',
      ownership: 'contractor',
      ownerName: '  محمد علي ',
      ownerPhone: ' ',
    });
    expect(contractor.inserted).toMatchObject({
      ownership: 'contractor',
      owner_name: 'محمد علي',
      owner_phone: null,
    });

    const owned = recorder({ data: row, error: null });
    await new SupabaseVehicleGateway(owned.client).insertVehicle(north, {
      ...emptyVehicleDetails,
      plateNumber: 'X 1',
      type: 'bus',
      ownership: 'owned',
      ownerName: 'leftover',
      ownerPhone: '0100',
    });
    expect(owned.inserted).toMatchObject({
      ownership: 'owned',
      owner_name: null,
      owner_phone: null,
    });
  });

  it('normalizes the plate, converts numbers, and stores blanks as null', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await gateway.insertVehicle(north, {
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
      ownership: 'owned',
      owner_name: null,
      owner_phone: null,
      rent_type: 'none',
      monthly_rent: null,
      outbound_rent: null,
      return_rent: null,
      notes: null,
      is_active: true,
    });
  });

  it('maps rent terms paid per trip', async () => {
    const calls = recorder({
      data: [
        {
          ...row,
          ownership: 'contractor',
          owner_name: 'محمد علي',
          rent_type: 'per_trip',
          outbound_rent: 30000,
          return_rent: 25000,
        },
      ],
      error: null,
    });

    const [vehicle] = await new SupabaseVehicleGateway(calls.client).listVehicles(north);

    expect(vehicle).toMatchObject({
      rentType: 'perTrip',
      monthlyRent: '',
      outboundRent: '300.00',
      returnRent: '250.00',
    });
  });

  it('stores a monthly rent in minor units and only the terms of its type', async () => {
    const calls = recorder({ data: row, error: null });
    await new SupabaseVehicleGateway(calls.client).insertVehicle(north, {
      ...emptyVehicleDetails,
      plateNumber: 'X 1',
      type: 'bus',
      ownership: 'rented',
      ownerName: 'مكتب النور',
      rentType: 'monthly',
      monthlyRent: '١٢٠٠٠',
      outboundRent: '100',
    });

    expect(calls.inserted).toMatchObject({
      rent_type: 'monthly',
      monthly_rent: 1200000,
      outbound_rent: null,
      return_rent: null,
    });
  });

  it('drops rent terms from a vehicle the company owns', async () => {
    const calls = recorder({ data: row, error: null });
    await new SupabaseVehicleGateway(calls.client).insertVehicle(north, {
      ...emptyVehicleDetails,
      plateNumber: 'X 1',
      type: 'bus',
      ownership: 'owned',
      rentType: 'monthly',
      monthlyRent: '12000',
    });

    expect(calls.inserted).toMatchObject({ rent_type: 'none', monthly_rent: null });
  });

  it('refuses rent terms without their amounts', async () => {
    const gateway = new SupabaseVehicleGateway(recorder({ data: row, error: null }).client);
    const contractor = {
      ...emptyVehicleDetails,
      plateNumber: 'X 1',
      type: 'bus' as const,
      ownership: 'contractor' as const,
      ownerName: 'محمد علي',
      rentType: 'perTrip' as const,
    };

    await expect(
      gateway.insertVehicle(north, { ...contractor, outboundRent: '300' }),
    ).rejects.toEqual(new VehicleAccessError('required'));
    await expect(
      gateway.insertVehicle(north, { ...contractor, outboundRent: '300', returnRent: 'abc' }),
    ).rejects.toEqual(new VehicleAccessError('amount'));
  });

  it('scopes an update to the vehicle and its organization', async () => {
    const calls = recorder({ data: { ...row, is_active: false }, error: null });
    const gateway = new SupabaseVehicleGateway(calls.client);

    await gateway.updateVehicle(north, 'vehicle-1', {
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
      gateway.insertVehicle(north, {
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
      gateway.insertVehicle(south, {
        ...emptyVehicleDetails,
        plateNumber: 'X 1',
        type: 'bus',
      }),
    ).rejects.toEqual(new VehicleAccessError('save'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseVehicleGateway(null);

    await expect(gateway.listVehicles(north)).rejects.toEqual(
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
