import { RouteAccessError } from '../application/route-access-error';
import { RouteOrganization } from '../domain/transport-route';
import { RouteGateway } from './route-gateway';
import { SupabaseRouteRepository } from './supabase-route-repository';

const north: RouteOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };

describe('SupabaseRouteRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseRouteRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    expect(gateway.membershipOrganizations).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an organization outside the memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseRouteRepository(gateway);

    await expect(repository.organization('org-south')).resolves.toBeNull();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseRouteRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new RouteAccessError('signedOut'),
    );
  });

  it('lists routes and choices with the membership organization id', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseRouteRepository(gateway);

    await repository.list(north);
    await repository.choices(north);

    expect(gateway.listRoutes).toHaveBeenCalledWith(north);
    expect(gateway.listChoices).toHaveBeenCalledWith('org-north');
  });
});

function fakeGateway(
  userId: string | null,
  memberships: RouteOrganization[],
): RouteGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listRoutes: vi.fn(async () => []),
    listChoices: vi.fn(async () => ({ customers: [], vehicles: [], drivers: [] })),
    insertRoute: vi.fn(),
    updateRoute: vi.fn(),
  };
}
