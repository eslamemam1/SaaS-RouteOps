import { Organization } from '../domain/organization';
import { OrganizationGateway } from './organization-gateway';
import { SupabaseOrganizationRepository } from './supabase-organization-repository';

const north: Organization = { id: 'org-north', name: 'North' };

describe('SupabaseOrganizationRepository', () => {
  it('loads organizations using ids from the signed-in user memberships', async () => {
    const gateway = fakeGateway({
      sessionUserId: 'user-1',
      membershipIds: ['org-north', 'org-south'],
      organizations: [north],
    });
    const repository = new SupabaseOrganizationRepository(gateway);

    await repository.listMine();

    expect(gateway.membershipOrganizationIds).toHaveBeenCalledWith('user-1');
    expect(gateway.organizationsByIds).toHaveBeenCalledWith([
      'org-north',
      'org-south',
    ]);
  });

  it('does not query organizations when the user has no memberships', async () => {
    const gateway = fakeGateway({
      sessionUserId: 'user-1',
      membershipIds: [],
      organizations: [],
    });
    const repository = new SupabaseOrganizationRepository(gateway);

    await expect(repository.listMine()).resolves.toEqual([]);
    expect(gateway.organizationsByIds).not.toHaveBeenCalled();
  });
});

function fakeGateway(options: {
  sessionUserId: string | null;
  membershipIds: string[];
  organizations: Organization[];
}): OrganizationGateway {
  return {
    isConfigured: () => true,
    sessionUserId: vi.fn(async () => options.sessionUserId),
    membershipOrganizationIds: vi.fn(async () => options.membershipIds),
    organizationsByIds: vi.fn(async () => options.organizations),
    isOperator: vi.fn(async () => false),
    companyAccounts: vi.fn(async () => []),
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    provision: vi.fn(async () => undefined),
  };
}
