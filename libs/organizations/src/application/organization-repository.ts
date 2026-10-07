import { Currency } from '@routeops/shared/money';
import { Dashboard } from '../domain/dashboard';
import { CompanyAccount, Organization } from '../domain/organization';

export interface ProvisionCompany {
  readonly organizationName: string;
  readonly email: string;
  readonly password: string;
  readonly currency: Currency;
}

// Session methods live here so the UI never imports Supabase.
// A separate auth port is not part of this workspace.
export abstract class OrganizationRepository {
  abstract isConfigured(): boolean;
  abstract signIn(email: string, password: string): Promise<void>;
  abstract signOut(): Promise<void>;
  abstract listMine(): Promise<Organization[]>;
  abstract currentUserIsOperator(): Promise<boolean>;
  abstract listCompanyAccounts(): Promise<CompanyAccount[]>;
  abstract setCompanyActive(
    organizationId: string,
    isActive: boolean,
  ): Promise<void>;
  abstract provisionCompany(input: ProvisionCompany): Promise<void>;
  abstract dashboard(organizationId: string, today: string): Promise<Dashboard>;
}
