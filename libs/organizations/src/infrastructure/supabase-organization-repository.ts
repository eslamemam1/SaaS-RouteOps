import { CompanyAccount, Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import {
  OrganizationRepository,
  ProvisionCompany,
} from '../application/organization-repository';
import { OrganizationGateway } from './organization-gateway';

export class SupabaseOrganizationRepository extends OrganizationRepository {
  constructor(private readonly gateway: OrganizationGateway) {
    super();
  }

  isConfigured(): boolean {
    return this.gateway.isConfigured();
  }

  signIn(email: string, password: string): Promise<void> {
    return this.gateway.signIn(email, password);
  }

  signOut(): Promise<void> {
    return this.gateway.signOut();
  }

  async listMine(): Promise<Organization[]> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new OrganizationAccessError('signedOut');
    }
    const organizationIds =
      await this.gateway.membershipOrganizationIds(userId);
    if (organizationIds.length === 0) {
      return [];
    }
    return this.gateway.organizationsByIds(organizationIds);
  }

  async currentUserIsOperator(): Promise<boolean> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      return false;
    }
    return this.gateway.isOperator(userId);
  }

  listCompanyAccounts(): Promise<CompanyAccount[]> {
    return this.gateway.companyAccounts();
  }

  provisionCompany(input: ProvisionCompany): Promise<void> {
    return this.gateway.provision(input);
  }
}
