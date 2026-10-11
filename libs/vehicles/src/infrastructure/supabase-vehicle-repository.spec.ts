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

  it("reads the vehicle's trips, rent, and expenses for the whole month, and the unopened days up to today", async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseVehicleRepository(gateway);

    await repository.month(north, 'vehicle-1', '2026-02', '2026-02-10');

    const month = { from: '2026-02-01', to: '2026-02-28' };
    expect(gateway.tripLog).toHaveBeenCalledWith('org-north', 'vehicle-1', month, '2026-02-10');
    expect(gateway.vehiclePay).toHaveBeenCalledWith('org-north', 'vehicle-1', month, '2026-02-10');
    expect(gateway.vehicleExpenses).toHaveBeenCalledWith('org-north', 'vehicle-1', month);
    expect(gateway.unopenedDays).toHaveBeenCalledWith('org-north', {
      from: '2026-02-01',
      to: '2026-02-10',
    });
  });

  it('looks for no unopened days in a month that has not started', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseVehicleRepository(gateway);

    const month = await repository.month(north, 'vehicle-1', '2026-03', '2026-02-10');

    expect(month.unopenedDays).toEqual([]);
    expect(gateway.unopenedDays).not.toHaveBeenCalled();
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
    findVehicle: vi.fn(async () => null),
    workChoices: vi.fn(async () => ({ customers: [], routes: [], drivers: [] })),
    vehicleRoutes: vi.fn(async () => []),
    tripLog: vi.fn(async () => []),
    vehiclePay: vi.fn(async () => null),
    vehicleExpenses: vi.fn(async () => []),
    unopenedDays: vi.fn(async () => []),
    insertVehicle: vi.fn(),
    updateVehicle: vi.fn(),
  };
}
