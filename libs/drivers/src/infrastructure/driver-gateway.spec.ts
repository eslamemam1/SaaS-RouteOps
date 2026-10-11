import { SupabaseClient } from '@supabase/supabase-js';
import { DriverAccessError } from '../application/driver-access-error';
import { emptyDriverDetails } from '../domain/driver';
import { Database } from './database';
import { SupabaseDriverGateway } from './driver-gateway';

type Result = {
  data: unknown;
  error: { message: string; code?: string; details?: string } | null;
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
  photo_path: null,
};
const photoPath = 'org-north/driver-1/photo.webp';

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
        photo: null,
      },
    ]);
    expect(calls.filters).toEqual([['organization_id', 'org-north']]);
    expect(calls.signed).toEqual([]);
  });

  it('signs every photo of the list in one request', async () => {
    const calls = recorder({
      data: [
        { ...row, photo_path: photoPath },
        { ...row, id: 'driver-2', photo_path: 'org-north/driver-2/photo.jpg' },
      ],
      error: null,
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    const drivers = await gateway.listDrivers(north);

    expect(calls.signed).toEqual([[photoPath, 'org-north/driver-2/photo.jpg']]);
    expect(drivers.map((driver) => driver.photo)).toEqual([
      { path: photoPath, url: `signed:${photoPath}` },
      {
        path: 'org-north/driver-2/photo.jpg',
        url: 'signed:org-north/driver-2/photo.jpg',
      },
    ]);
  });

  it('shows no photo when its link cannot be signed', async () => {
    const calls = recorder(
      { data: [{ ...row, photo_path: photoPath }], error: null },
      { data: null, error: { message: 'storage down' } },
    );
    const gateway = new SupabaseDriverGateway(calls.client);

    const [driver] = await gateway.listDrivers(north);

    expect(driver.photo).toBeNull();
  });

  it('uploads a photo as a new file and reports a refused upload', async () => {
    const photo = new Blob(['photo'], { type: 'image/webp' });
    const calls = recorder({ data: null, error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await gateway.uploadPhoto(photoPath, photo);
    expect(calls.uploaded).toEqual([
      photoPath,
      photo,
      expect.objectContaining({ contentType: 'image/webp', upsert: false }),
    ]);

    calls.failUpload();
    await expect(gateway.uploadPhoto(photoPath, photo)).rejects.toEqual(
      new DriverAccessError('save'),
    );
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
    const salaried = {
      ...emptyDriverDetails,
      fullName: 'أحمد',
      payType: 'salary' as const,
    };

    await expect(gateway.insertDriver(north, salaried)).rejects.toEqual(
      new DriverAccessError('required'),
    );
    await expect(
      gateway.insertDriver(north, {
        ...salaried,
        monthlySalary: '3000',
        salaryTrips: '26',
        outboundPay: '50',
      }),
    ).rejects.toEqual(new DriverAccessError('required'));
    await expect(
      gateway.insertDriver(north, {
        ...salaried,
        monthlySalary: '3000',
        salaryTrips: 'x',
      }),
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

  it('names the active routes that keep a driver from being made inactive', async () => {
    const calls = recorder({
      data: null,
      error: { message: 'active_routes', code: 'P0001', details: 'Nasr City\nShubra' },
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.updateDriver(north, 'driver-1', { ...emptyDriverDetails, fullName: 'أحمد', active: false }),
    ).rejects.toMatchObject({ problem: 'activeRoutes', routes: ['Nasr City', 'Shubra'] });
  });

  it('replaces any other database error with a safe code', async () => {
    const calls = recorder({
      data: null,
      error: {
        message: 'new row violates row-level security policy',
        code: '42501',
      },
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.insertDriver(south, { ...emptyDriverDetails, fullName: 'X' }),
    ).rejects.toEqual(new DriverAccessError('save'));
  });

  it("lists the driver's trips of a period with the status the reports count them under", async () => {
    const calls = recorder({
      data: [
        {
          id: 'trip-1',
          service_date: '2026-02-02',
          departure_time: '07:30:00',
          direction: 'outbound',
          customer_id: 'customer-1',
          route_id: null,
          vehicle_id: null,
          driver_id: 'driver-2',
          planned_driver_id: 'driver-1',
          is_extra: false,
          status: 'done',
          change_reason: 'driver_absent',
          notes: null,
          price: 5000,
        },
      ],
      error: null,
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.tripLog('org-north', 'driver-1', { from: '2026-02-01', to: '2026-02-28' }, '2026-02-10'),
    ).resolves.toEqual([
      {
        id: 'trip-1',
        serviceDate: '2026-02-02',
        departureTime: '07:30',
        direction: 'outbound',
        customerId: 'customer-1',
        routeId: '',
        vehicleId: '',
        driverId: 'driver-2',
        plannedDriverId: 'driver-1',
        extra: false,
        status: 'done',
        reason: 'driverAbsent',
        notes: '',
        price: 5000,
      },
    ]);
    expect(calls.rpcs).toEqual([
      [
        'trip_log',
        {
          p_organization_id: 'org-north',
          p_from: '2026-02-01',
          p_to: '2026-02-28',
          p_today: '2026-02-10',
          p_driver_id: 'driver-1',
        },
      ],
    ]);
  });

  it('refuses a trip status this app does not know', async () => {
    const calls = recorder({
      data: [
        {
          id: 'trip-1',
          service_date: '2026-02-02',
          departure_time: '07:30:00',
          direction: 'outbound',
          customer_id: 'customer-1',
          route_id: null,
          vehicle_id: null,
          driver_id: 'driver-1',
          planned_driver_id: null,
          is_extra: false,
          status: 'lost',
          change_reason: null,
          notes: null,
          price: null,
        },
      ],
      error: null,
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.tripLog('org-north', 'driver-1', { from: '2026-02-01', to: '2026-02-28' }, '2026-02-10'),
    ).rejects.toEqual(new DriverAccessError('load'));
  });

  it("reads only this driver's pay of the month", async () => {
    const calls = recorder({
      data: [
        {
          driver_id: 'driver-1',
          pay_type: 'per_trip',
          monthly_salary: null,
          salary_trips: null,
          outbound_pay: 100,
          return_pay: 120,
          done_outbound: 3,
          done_return: 2,
          absent_outbound: 1,
          absent_return: 0,
          recorded: 50,
        },
      ],
      error: null,
    });
    const gateway = new SupabaseDriverGateway(calls.client);

    const pay = await gateway.driverPay(
      'org-north',
      'driver-1',
      { from: '2026-02-01', to: '2026-02-28' },
      '2026-02-10',
    );

    expect(calls.filters).toEqual([['driver_id', 'driver-1']]);
    expect(pay).toEqual({
      driverId: 'driver-1',
      payType: 'perTrip',
      monthlySalary: null,
      salaryTrips: null,
      tripPay: { outbound: 100, return: 120 },
      done: { outbound: 3, return: 2 },
      absent: { outbound: 1, return: 0 },
      recorded: 50,
    });
  });

  it('has no pay for a driver without pay terms', async () => {
    const calls = recorder({ data: [], error: null });
    const gateway = new SupabaseDriverGateway(calls.client);

    await expect(
      gateway.driverPay('org-north', 'driver-1', { from: '2026-02-01', to: '2026-02-28' }, '2026-02-10'),
    ).resolves.toBeNull();
  });

  it('reports that the app is not connected when there is no client', async () => {
    const gateway = new SupabaseDriverGateway(null);

    await expect(gateway.listDrivers(north)).rejects.toEqual(
      new DriverAccessError('notConnected'),
    );
  });
});

function recorder(result: Result, signing?: Result) {
  const filters: [string, string][] = [];
  const rpcs: [string, unknown][] = [];
  const signed: string[][] = [];
  let inserted: unknown = null;
  let uploaded: unknown[] = [];
  let uploadError: { message: string } | null = null;
  const bucket = {
    createSignedUrls: (paths: string[]) => {
      signed.push(paths);
      return Promise.resolve(
        signing ?? {
          data: paths.map((path) => ({ path, signedUrl: `signed:${path}` })),
          error: null,
        },
      );
    },
    upload: (...args: unknown[]) => {
      uploaded = args;
      return Promise.resolve({ data: null, error: uploadError });
    },
    remove: () => Promise.resolve({ data: [], error: null }),
  };
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
  const rpcPage = {
    order: () => rpcPage,
    range: () => Promise.resolve(result),
    eq: (column: string, value: string) => {
      filters.push([column, value]);
      return Promise.resolve(result);
    },
  };
  return {
    filters,
    rpcs,
    signed,
    get inserted() {
      return inserted;
    },
    get uploaded() {
      return uploaded;
    },
    failUpload: () => {
      uploadError = { message: 'too large' };
    },
    client: {
      from: () => query,
      rpc: (name: string, args: unknown) => {
        rpcs.push([name, args]);
        return rpcPage;
      },
      storage: { from: () => bucket },
    } as unknown as SupabaseClient<Database>,
  };
}
