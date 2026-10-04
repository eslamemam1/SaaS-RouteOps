import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsOrganization } from '../domain/daily-trip';
import { OperationsGateway } from './operations-gateway';
import { SupabaseOperationsRepository } from './supabase-operations-repository';

const north: OperationsOrganization = { id: 'org-north', name: 'North' };

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

  it('needs at least one customer to record a holiday', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseOperationsRepository(gateway);

    await expect(
      repository.cancelForHoliday(north, '2026-10-06', []),
    ).rejects.toEqual(new OperationsAccessError('customers'));
    expect(gateway.cancelCustomerTrips).not.toHaveBeenCalled();
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
    updateTrip: vi.fn(),
    cancelCustomerTrips: vi.fn(async () => undefined),
  };
}
