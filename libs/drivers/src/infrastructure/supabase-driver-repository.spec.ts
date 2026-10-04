import { DriverAccessError } from '../application/driver-access-error';
import { DriverOrganization } from '../domain/driver';
import { DriverGateway } from './driver-gateway';
import { SupabaseDriverRepository } from './supabase-driver-repository';

const north: DriverOrganization = { id: 'org-north', name: 'North' };

describe('SupabaseDriverRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    expect(gateway.membershipOrganizations).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an organization outside the memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-south')).resolves.toBeNull();
    expect(gateway.listDrivers).not.toHaveBeenCalled();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new DriverAccessError('signedOut'),
    );
    expect(gateway.membershipOrganizations).not.toHaveBeenCalled();
  });

  it('lists drivers with the membership organization id', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    const organization = await repository.organization('org-north');
    await repository.list(organization ?? north);

    expect(gateway.listDrivers).toHaveBeenCalledWith('org-north');
  });
});

function fakeGateway(
  userId: string | null,
  memberships: DriverOrganization[],
): DriverGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listDrivers: vi.fn(async () => []),
    insertDriver: vi.fn(),
    updateDriver: vi.fn(),
  };
}
