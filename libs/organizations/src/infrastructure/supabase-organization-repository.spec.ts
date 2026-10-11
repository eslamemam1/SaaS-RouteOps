import { DashboardFacts } from '../domain/dashboard';
import { CompanyAccount, Organization } from '../domain/organization';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { OrganizationGateway } from './organization-gateway';
import { SupabaseOrganizationRepository } from './supabase-organization-repository';

const north: Organization = { id: 'org-north', name: 'North', currency: 'EGP', isActive: true };

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

  it('builds the dashboard from the whole month of today', async () => {
    const gateway = fakeGateway({ sessionUserId: 'user-1', membershipIds: [], organizations: [] });
    const repository = new SupabaseOrganizationRepository(gateway);

    const summary = await repository.dashboard('org-north', '2026-10-08');

    expect(gateway.dashboardFacts).toHaveBeenCalledWith(
      'org-north',
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-08',
      { from: '2026-09-01', to: '2026-09-30' },
    );
    expect(summary.month.profit).toBe(-20000);
    expect(summary.payMonth).toBe('2026-09');
  });

  it('records a payment in the smallest unit of the company currency', async () => {
    const gateway = fakeGateway({ sessionUserId: 'user-1', membershipIds: [], organizations: [] });
    const repository = new SupabaseOrganizationRepository(gateway);

    await repository.recordSubscriptionPayment(kuwait, {
      organizationId: 'org-kuwait',
      paidOn: '2026-10-03',
      coversMonth: '2026-10',
      amount: '12.5',
      note: 'Transfer',
    });

    expect(gateway.insertSubscriptionPayment).toHaveBeenCalledWith({
      organizationId: 'org-kuwait',
      paidOn: '2026-10-03',
      coversMonth: '2026-10',
      amount: 12_500,
      note: 'Transfer',
    });
  });

  it('refuses a payment of zero before reaching the database', async () => {
    const gateway = fakeGateway({ sessionUserId: 'user-1', membershipIds: [], organizations: [] });
    const repository = new SupabaseOrganizationRepository(gateway);

    await expect(
      repository.recordSubscriptionPayment(kuwait, {
        organizationId: 'org-kuwait',
        paidOn: '2026-10-03',
        coversMonth: '2026-10',
        amount: '0',
        note: '',
      }),
    ).rejects.toEqual(new SubscriptionPaymentError('amount'));
    expect(gateway.insertSubscriptionPayment).not.toHaveBeenCalled();
  });
});

const kuwait: CompanyAccount = {
  id: 'org-kuwait',
  name: 'Kuwait Transport',
  currency: 'KWD',
  isActive: true,
  logins: [],
  createdAt: '2026-01-01T09:00:00Z',
  lastSignInAt: null,
};

const facts: DashboardFacts = {
  todayTrips: [],
  todayDone: 0,
  monthDone: 3,
  monthRevenue: 30000,
  monthUnpriced: 0,
  monthExpenses: 50000,
  unopenedDays: [],
  unrecordedDriverPay: 0,
  unrecordedVehiclePay: 0,
  setup: { customers: 1, drivers: 1, routes: 1 },
};

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
    setOrganizationActive: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    provision: vi.fn(async () => undefined),
    setLoginPassword: vi.fn(async () => undefined),
    subscriptionPayments: vi.fn(async () => []),
    insertSubscriptionPayment: vi.fn(async (payment) => ({ id: 'payment-1', ...payment })),
    deleteSubscriptionPayment: vi.fn(async () => undefined),
    dashboardFacts: vi.fn(async () => facts),
  };
}
