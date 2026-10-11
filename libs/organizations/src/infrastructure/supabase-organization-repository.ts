import { Dashboard, dashboard, monthDays } from '../domain/dashboard';
import { toMinorUnits } from '@routeops/shared/money';
import { CompanyAccount, Organization } from '../domain/organization';
import {
  PaymentDetails,
  SubscriptionPayment,
} from '../domain/subscription-payment';
import { OrganizationAccessError } from '../application/organization-access-error';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
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

  setCompanyActive(organizationId: string, isActive: boolean): Promise<void> {
    return this.gateway.setOrganizationActive(organizationId, isActive);
  }

  provisionCompany(input: ProvisionCompany): Promise<void> {
    return this.gateway.provision(input);
  }

  setLoginPassword(loginId: string, password: string): Promise<void> {
    return this.gateway.setLoginPassword(loginId, password);
  }

  listSubscriptionPayments(): Promise<SubscriptionPayment[]> {
    return this.gateway.subscriptionPayments();
  }

  async recordSubscriptionPayment(
    account: CompanyAccount,
    details: PaymentDetails,
  ): Promise<SubscriptionPayment> {
    const amount = toMinorUnits(details.amount, account.currency);
    if (typeof amount !== 'number' || amount <= 0) {
      throw new SubscriptionPaymentError('amount');
    }
    return this.gateway.insertSubscriptionPayment({
      organizationId: account.id,
      paidOn: details.paidOn,
      coversMonth: details.coversMonth,
      amount,
      note: details.note,
    });
  }

  removeSubscriptionPayment(paymentId: string): Promise<void> {
    return this.gateway.deleteSubscriptionPayment(paymentId);
  }

  async dashboard(organizationId: string, today: string): Promise<Dashboard> {
    const facts = await this.gateway.dashboardFacts(organizationId, monthDays(today), today);
    return dashboard(facts, today);
  }
}
