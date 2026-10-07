import { SupabaseClient } from '@supabase/supabase-js';
import { DriverAccessError } from '../application/driver-access-error';
import { emptyDriverDetails } from '../domain/driver';
import { Database } from './database';
import { SupabaseDriverGateway } from './driver-gateway';

type Result = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

const north = { id: 'org-north', name: 'North', currency: 'EGP' } as const;
const south = { id: 'org-south', name: 'South', currency: 'EGP' } as const;

const row = {
  id: 'driver-1',
  full_name: 'أحمد محمد',
  phone: '0100',
  national_id: null,
  license_number: null,
  license_expires_on: '2027-01-31',
  pay_type: 'none',
  monthly_salary: null,
  salary_trips: null,
  outbound_pay: null,
  return_pay: null,
  notes: null,
  is_active: true,
};

describe('SupabaseDriverGateway', () => {
  it('filters the driver list by organization and maps empty columns to blank text', async () => {
    const calls = recorder({ data: [row], error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(gateway.listDrivers(north)).resolves.toEqual([
      {
        id: 'driver-1',
        fullName: 'أحمد محمد',
        phone: '0100',
        nationalId: '',
        licenseNumber: '',
        licenseExpiry: '2027-01-31',
        payType: 'none',
        monthlySalary: '',
        salaryTrips: '',
        outboundPay: '',
        returnPay: '',
        notes: '',
        active: true,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
  });

  it('trims the name, normalizes the national ID, and stores blanks as null', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.insertDriver(north, {
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
      pay_type: 'none',
      monthly_salary: null,
      salary_trips: null,
      outbound_pay: null,
      return_pay: null,
      notes: null,
      is_active: true,
    });
  });

  it('stores a salary covering trips in the smallest unit of the currency', async () => {
    const calls = recorder({
      data: {
        ...row,
        pay_type: 'salary',
        monthly_salary: 300050,
        salary_trips: 26,
        outbound_pay: 5000,
        return_pay: 4000,
      },
      error: null,
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    const saved = await gateway.insertDriver(north, {
      ...emptyDriverDetails,
      fullName: 'أحمد',
      payType: 'salary',
      monthlySalary: '٣٠٠٠.٥',
      salaryTrips: '٢٦',
      outboundPay: '50',
      returnPay: '40',
    });

    expect(calls.inserted).toMatchObject({
      pay_type: 'salary',
      monthly_salary: 300050,
      salary_trips: 26,
      outbound_pay: 5000,
      return_pay: 4000,
    });
    expect(saved).toMatchObject({
      payType: 'salary',
      monthlySalary: '3000.50',
      salaryTrips: '26',
      outboundPay: '50.00',
      returnPay: '40.00',
    });
  });

  it('keeps only the terms of the chosen pay type', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.insertDriver(north, {
      ...emptyDriverDetails,
      fullName: 'محمود',
      payType: 'perTrip',
      monthlySalary: '3000',
      salaryTrips: '26',
      outboundPay: '60',
      returnPay: '40',
    });

    expect(calls.inserted).toMatchObject({
      pay_type: 'per_trip',
      monthly_salary: null,
      salary_trips: null,
      outbound_pay: 6000,
      return_pay: 4000,
    });
  });

  it('refuses pay terms that are missing or not amounts', async () => {
    const calls = recorder({ data: row, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);
    const salaried = { ...emptyDriverDetails, fullName: 'أحمد', payType: 'salary' as const };

    await expect(gateway.insertDriver(north, salaried)).rejects.toEqual(
      new DriverAccessError('required'),
    );
    await expect(
      gateway.insertDriver(north, { ...salaried, monthlySalary: '3000', salaryTrips: '26', outboundPay: '50' }),
    ).rejects.toEqual(new DriverAccessError('required'));
    await expect(
      gateway.insertDriver(north, { ...salaried, monthlySalary: '3000', salaryTrips: 'x' }),
    ).rejects.toEqual(new DriverAccessError('trips'));
    await expect(
      gateway.insertDriver(north, { ...salaried, monthlySalary: '50.123' }),
    ).rejects.toEqual(new DriverAccessError('amount'));
    expect(calls.inserted).toBeNull();
  });

  it('scopes an update to the driver and its organization', async () => {
    const calls = recorder({ data: { ...row, is_active: false }, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.updateDriver(north, 'driver-1', {
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
      gateway.insertDriver(north, {
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
      gateway.insertDriver(south, { ...emptyDriverDetails, fullName: 'X' }),
    ).rejects.toEqual(new DriverAccessError('save'));
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseDriverGateway(null);

    await expect(gateway.listDrivers(north)).rejects.toEqual(
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
