import { OperationsAccessError } from '../application/operations-access-error';
import { emptyExtraTrip, OperationsOrganization } from '../domain/daily-trip';
import { OperationsGateway } from './operations-gateway';
import { SupabaseOperationsRepository } from './supabase-operations-repository';

const north: OperationsOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };

describe('SupabaseOperationsRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    await expect(repository.organization('org-south')).resolves.toBeNull();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new OperationsAccessError('signedOut'),
    );
  });

  it('prepares the day before listing its trips', async () => {
    const order: string[] = [];
    const gateway = fakeGateway('user-1', [north]);
    vi.mocked(gateway.prepareDay).mockImplementation(async () => {
      order.push('prepare');
    });
    vi.mocked(gateway.listTrips).mockImplementation(async () => {
      order.push('list');
      return [];
    });
    const repository = new SupabaseOperationsRepository(gateway);

    await repository.day(north, '2026-10-04');

    expect(gateway.prepareDay).toHaveBeenCalledWith('org-north', '2026-10-04');
    expect(order).toEqual(['prepare', 'list']);
  });

  it('rejects an invalid date without touching the database', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(repository.day(north, '2026-02-30')).rejects.toEqual(
      new OperationsAccessError('date'),
    );
    expect(gateway.prepareDay).not.toHaveBeenCalled();
  });

  it('refuses an extra trip without a company or time before calling the database', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(
      repository.addExtraTrip(north, '2026-10-04', emptyExtraTrip),
    ).rejects.toEqual(new OperationsAccessError('customer'));
    await expect(
      repository.addExtraTrip(north, '2026-10-04', {
        ...emptyExtraTrip,
        customerId: 'delta',
      }),
    ).rejects.toEqual(new OperationsAccessError('time'));
    expect(gateway.insertExtraTrip).not.toHaveBeenCalled();
  });

  it('adds a valid extra trip for the organization and day', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);
    const details = {
      ...emptyExtraTrip,
      customerId: 'delta',
      departureTime: '21:00',
      arrivalTime: '23:00',
      driverId: 'ahmed',
    };

    await repository.addExtraTrip(north, '2026-10-04', details);
    await repository.addExtraTrip(north, '2026-10-04', {
      ...details,
      tripPrice: '250.5',
    });

    expect(gateway.insertExtraTrip).toHaveBeenNthCalledWith(
      1,
      'org-north',
      '2026-10-04',
      details,
      null,
    );
    expect(gateway.insertExtraTrip).toHaveBeenNthCalledWith(
      2,
      'org-north',
      '2026-10-04',
      { ...details, tripPrice: '250.5' },
      25050,
    );
  });

  it('refuses an extra trip or a change without a driver', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(
      repository.addExtraTrip(north, '2026-10-04', {
        ...emptyExtraTrip,
        customerId: 'delta',
        departureTime: '21:00',
        arrivalTime: '23:00',
      }),
    ).rejects.toEqual(new OperationsAccessError('driver'));
    await expect(
      repository.changeTrip(
        north,
        {
          id: 'trip-1',
          routeId: 'route-1',
          serviceDate: '2026-10-04',
          direction: 'outbound',
          departureTime: '07:00',
          arrivalTime: '09:00',
          customerId: 'delta',
          vehicleId: '',
          driverId: 'ahmed',
          cancelled: false,
          reason: '',
          notes: '',
          done: false,
          extra: false,
        },
        {
          vehicleId: '',
          driverId: '',
          cancelled: false,
          reason: 'driverAbsent',
          notes: '',
        },
      ),
    ).rejects.toEqual(new OperationsAccessError('driver'));
    expect(gateway.insertExtraTrip).not.toHaveBeenCalled();
    expect(gateway.updateTrip).not.toHaveBeenCalled();
  });

  it('needs at least one customer to record a holiday', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(
      repository.cancelForHoliday(north, '2026-10-06', []),
    ).rejects.toEqual(new OperationsAccessError('customers'));
    expect(gateway.cancelCustomerTrips).not.toHaveBeenCalled();
  });

  it('adds route trips only for chosen routes on days that have passed', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);
    const days = { from: '2026-10-01', to: '2026-10-11' };

    await expect(
      repository.addRouteTrips(north, [], days, '2026-10-12'),
    ).rejects.toEqual(new OperationsAccessError('routes'));
    await expect(
      repository.addRouteTrips(
        north,
        ['route-1'],
        { from: '2026-10-01', to: '2026-10-12' },
        '2026-10-12',
      ),
    ).rejects.toEqual(new OperationsAccessError('pastDays'));
    expect(gateway.addRouteTrips).not.toHaveBeenCalled();

    await expect(
      repository.addRouteTrips(north, ['route-1'], days, '2026-10-12'),
    ).resolves.toBe(6);
    expect(gateway.addRouteTrips).toHaveBeenCalledWith(
      'org-north',
      ['route-1'],
      days,
    );
  });
});

function fakeGateway(
  userId: string | null,
  memberships: OperationsOrganization[],
): OperationsGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    prepareDay: vi.fn(async () => undefined),
    listTrips: vi.fn(async () => []),
    listChoices: vi.fn(async () => ({
      customers: [],
      vehicles: [],
      drivers: [],
      routes: [],
    })),
    listTripRecordings: vi.fn(async () => []),
    saveTripRecording: vi.fn(async () => undefined),
    updateTrip: vi.fn(),
    updateDone: vi.fn(),
    insertExtraTrip: vi.fn(),
    deleteTrip: vi.fn(async () => undefined),
    listTripOmissions: vi.fn(async () => []),
    restoreOmittedTrip: vi.fn(async () => undefined),
    cancelCustomerTrips: vi.fn(async () => undefined),
    addRouteTrips: vi.fn(async () => 6),
  };
}
