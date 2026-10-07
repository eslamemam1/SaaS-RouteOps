import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleOrganization } from '../domain/vehicle';
import { SupabaseVehicleRepository } from './supabase-vehicle-repository';
import { VehicleGateway } from './vehicle-gateway';

const north: VehicleOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };

describe('SupabaseVehicleRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseVehicleRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    expect(gateway.membershipOrganizations).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an organization outside the memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseVehicleRepository(gateway);

    await expect(repository.organization('org-south')).resolves.toBeNull();
    expect(gateway.listVehicles).not.toHaveBeenCalled();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseVehicleRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new VehicleAccessError('signedOut'),
    );
    expect(gateway.membershipOrganizations).not.toHaveBeenCalled();
  });

  it('lists vehicles with the membership organization id', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseVehicleRepository(gateway);

    const organization = await repository.organization('org-north');
    await repository.list(organization ?? north);

    expect(gateway.listVehicles).toHaveBeenCalledWith(north);
  });
});

function fakeGateway(
  userId: string | null,
  memberships: VehicleOrganization[],
): VehicleGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listVehicles: vi.fn(async () => []),
    insertVehicle: vi.fn(),
    updateVehicle: vi.fn(),
  };
}
