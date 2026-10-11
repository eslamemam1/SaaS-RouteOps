import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@routeops/shared/i18n';
import { Dashboard } from '../domain/dashboard';
import { CompanyAccount, Organization } from '../domain/organization';
import { SubscriptionPayment } from '../domain/subscription-payment';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { Organizations } from './organizations';
import { organizationsText } from './organizations-text';

const north: Organization = { id: 'org-north', name: 'North', currency: 'EGP', isActive: true };
const busy: Dashboard = {
  today: { status: 'open', planned: 12, done: 7, cancelled: 1 },
  month: { done: 180, revenue: 9_000_000, expenses: 6_500_000, profit: 2_500_000 },
  attention: { unopenedDays: 1, driverPay: 2, vehiclePay: 0, unpriced: 3 },
  firstUnopenedDay: '2026-10-03',
  payMonth: '2026-09',
  setup: { customers: 2, drivers: 3, routes: 4 },
};
const calm: Dashboard = {
  ...busy,
  today: { status: 'unopened', planned: 0, done: 0, cancelled: 0 },
  month: { done: 10, revenue: 100_000, expenses: 400_000, profit: -300_000 },
  attention: { unopenedDays: 0, driverPay: 0, vehiclePay: 0, unpriced: 0 },
  firstUnopenedDay: null,
};
const gulf: CompanyAccount = {
  id: 'org-gulf',
  name: 'Gulf Transport',
  currency: 'SAR',
  isActive: true,
  logins: [{ id: 'login-gulf', email: 'gulf@example.com' }],
  createdAt: '2026-10-01T09:00:00Z',
  lastSignInAt: null,
};
const quiet: CompanyAccount = {
  id: 'org-quiet',
  name: 'Quiet Transport',
  currency: 'EGP',
  isActive: false,
  logins: [],
  createdAt: '2026-09-01T09:00:00Z',
  lastSignInAt: '2026-09-02T09:00:00Z',
};
const arabic = organizationsText.ar;
const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const gulfPayment: SubscriptionPayment = {
  id: 'payment-1',
  organizationId: 'org-gulf',
  paidOn: `${thisMonth}-01`,
  coversMonth: thisMonth,
  amount: 40_000,
  note: 'Bank transfer',
};

describe('Organizations', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the assigned organization', async () => {
    let resolveList: (organizations: Organization[]) => void = () => undefined;
    const fixture = await render({
      listMine: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });

    expect(text(fixture)).toContain(arabic.home.loading);

    resolveList([north]);
    await settle(fixture);

    expect(text(fixture)).toContain(`${arabic.home.welcome} North`);
  });

  it('shows today’s trips, the month’s figures, and what needs attention', async () => {
    const dashboard = vi.fn<OrganizationRepository['dashboard']>(async () => busy);
    const fixture = await render({ listMine: async () => [north], dashboard });
    await settle(fixture);
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(dashboard).toHaveBeenCalledWith('org-north', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect([...element.querySelectorAll('.dashboard-today dd')].map((item) => item.textContent?.trim())).toEqual([
      '12',
      '7',
      '1',
    ]);
    expect(text(fixture)).toContain('90,000.00');
    expect(text(fixture)).toContain('25,000.00');
    const attention = [...element.querySelectorAll('.dashboard-attention a')];
    expect(attention.map((link) => link.getAttribute('href'))).toEqual([
      '/organizations/org-north/operations?date=2026-10-03',
      '/organizations/org-north/expenses?month=2026-09',
      '/organizations/org-north/routes',
    ]);
    expect(attention[1].textContent).toContain(arabic.dashboard.driverPay);
    expect(attention[1].textContent).toContain('2');
    expect(text(fixture)).not.toContain(arabic.setup.title);
  });

  it('guides a new company through its first customer, driver, and route', async () => {
    const fixture = await render({
      listMine: async () => [north],
      dashboard: async () => ({ ...calm, setup: { customers: 1, drivers: 0, routes: 0 } }),
    });
    await settle(fixture);
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(text(fixture)).toContain(arabic.setup.title);
    expect(element.querySelectorAll('.dashboard-setup-done')).toHaveLength(1);
    expect(
      [...element.querySelectorAll('.dashboard-setup a')].map((link) => link.getAttribute('href')),
    ).toEqual(['/organizations/org-north/drivers', '/organizations/org-north/routes']);
    expect(text(fixture)).not.toContain(arabic.dashboard.allClear);
  });

  it('asks to open today, marks a loss, and says when everything is recorded', async () => {
    const fixture = await render({ listMine: async () => [north], dashboard: async () => calm });
    await settle(fixture);
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(text(fixture)).toContain(arabic.dashboard.unopenedTitle);
    expect(text(fixture)).toContain(arabic.dashboard.loss);
    expect(element.querySelector('.ro-stat[data-tone="danger"]')).toBeTruthy();
    expect(text(fixture)).toContain(arabic.dashboard.allClear);
  });

  it('shows a safe error when the figures cannot load and tries again', async () => {
    const dashboard = vi
      .fn<OrganizationRepository['dashboard']>()
      .mockRejectedValueOnce(new OrganizationAccessError('load'))
      .mockResolvedValueOnce(busy);
    const fixture = await render({ listMine: async () => [north], dashboard });
    await settle(fixture);
    await settle(fixture);
    expect(text(fixture)).toContain(arabic.problems.load);

    const element: HTMLElement = fixture.nativeElement;
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === arabic.dashboard.retry)!
      .click();
    await settle(fixture);
    await settle(fixture);

    expect(element.querySelectorAll('.dashboard-today dd')).toHaveLength(3);
  });

  it('lets a member of two companies choose which one to open', async () => {
    const south: Organization = { id: 'org-south', name: 'South', currency: 'EGP', isActive: true };
    const fixture = await render({ listMine: async () => [north, south] });
    await settle(fixture);

    expect(text(fixture)).toContain(arabic.home.chooseTitle);
    const element: HTMLElement = fixture.nativeElement;
    const southButton = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'South',
    )!;
    southButton.click();
    await settle(fixture);

    expect(text(fixture)).toContain(`${arabic.home.welcome} South`);
    expect(southButton.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('a[href="/organizations/org-south/routes"]')).toBeTruthy();
  });

  it('shows an empty state when the account has no organization', async () => {
    const fixture = await render({ listMine: async () => [] });
    await settle(fixture);

    expect(text(fixture)).toContain(arabic.home.noCompany);
  });

  it('shows a safe error when loading fails', async () => {
    const fixture = await render({
      listMine: async () => {
        throw new OrganizationAccessError('load');
      },
    });
    await settle(fixture);

    expect(text(fixture)).toContain(arabic.problems.load);
    expect(text(fixture)).not.toContain('select ');
  });

  it('lets the operator create a company in Egyptian pounds or another currency', async () => {
    const provisionCompany = vi.fn<OrganizationRepository['provisionCompany']>(
      async () => undefined,
    );
    const fixture = await render({
      currentUserIsOperator: async () => true,
      provisionCompany,
    });
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const currency = element.querySelector('select') as HTMLSelectElement;

    expect(currency.value).toBe('EGP');
    expect(text(fixture)).toContain(arabic.currencies.SAR);

    const [name, email, password] = Array.from(
      element.querySelectorAll('app-provision-company input'),
    ) as HTMLInputElement[];
    fill(name, 'Gulf Transport');
    fill(email, 'gulf@example.com');
    fill(password, 'secret1');
    currency.value = 'SAR';
    currency.dispatchEvent(new Event('input'));
    const timeZone = element.querySelectorAll('app-provision-company select')[1] as HTMLSelectElement;
    expect(timeZone.value).toBe('Africa/Cairo');
    timeZone.value = 'Asia/Riyadh';
    timeZone.dispatchEvent(new Event('input'));
    (element.querySelector('app-provision-company form') as HTMLFormElement)
      .dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(provisionCompany).toHaveBeenCalledWith({
      organizationName: 'Gulf Transport',
      email: 'gulf@example.com',
      password: 'secret1',
      currency: 'SAR',
      timeZone: 'Asia/Riyadh',
    });
  });

  it('shows the operator every company account with its login', async () => {
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf, quiet],
    });
    await settle(fixture);

    const rows = accountRows(fixture);
    expect(text(fixture)).toContain(arabic.accounts.title);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Gulf Transport');
    expect(rows[0]).toContain('gulf@example.com');
    expect(rows[0]).toContain(arabic.currencies.SAR);
    expect(rows[0]).toContain(arabic.accounts.neverSignedIn);
    expect(rows[1]).toContain(arabic.accounts.noLogin);
    expect(rows[1]).not.toContain(arabic.accounts.neverSignedIn);
  });

  it('adds a new company to the operator lists after creating it', async () => {
    let created = false;
    const listCompanyAccounts = vi.fn(async () => (created ? [gulf] : []));
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts,
      provisionCompany: async () => {
        created = true;
      },
    });
    await settle(fixture);
    expect(text(fixture)).toContain(arabic.accounts.empty);

    const element: HTMLElement = fixture.nativeElement;
    const [name, email, password] = Array.from(
      element.querySelectorAll('app-provision-company input'),
    ) as HTMLInputElement[];
    fill(name, 'Gulf Transport');
    fill(email, 'gulf@example.com');
    fill(password, 'secret1');
    (element.querySelector('app-provision-company form') as HTMLFormElement)
      .dispatchEvent(new Event('submit'));
    await settle(fixture);
    await settle(fixture);

    expect(accountRows(fixture)[0]).toContain('Gulf Transport');
    expect(payments(fixture).textContent).not.toContain(arabic.payments.noCompanies);
  });

  it('shows a safe error when the company accounts cannot load and tries again', async () => {
    let failing = true;
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => {
        if (failing) {
          throw new OrganizationAccessError('load');
        }
        return [gulf];
      },
    });
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    const accounts = element.querySelector('app-company-accounts')!;
    expect(accounts.textContent).toContain(arabic.problems.load);
    failing = false;

    [...accounts.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === arabic.accounts.retry)!
      .click();
    await settle(fixture);

    expect(accountRows(fixture)[0]).toContain('Gulf Transport');
  });

  it('lets the operator stop an unpaid account and turn it back on', async () => {
    const setCompanyActive = vi.fn<OrganizationRepository['setCompanyActive']>(
      async () => undefined,
    );
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      setCompanyActive,
    });
    await settle(fixture);
    expect(accountRows(fixture)[0]).toContain(arabic.accounts.active);

    accountButton(fixture, arabic.accounts.deactivate).click();
    await settle(fixture);

    expect(setCompanyActive).toHaveBeenCalledWith('org-gulf', false);
    expect(accountRows(fixture)[0]).toContain(arabic.accounts.inactive);
    expect(text(fixture)).toContain(arabic.accounts.deactivated);

    accountButton(fixture, arabic.accounts.activate).click();
    await settle(fixture);

    expect(setCompanyActive).toHaveBeenLastCalledWith('org-gulf', true);
    expect(accountRows(fixture)[0]).toContain(arabic.accounts.active);
  });

  it('keeps the account status and explains when it cannot change', async () => {
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      setCompanyActive: async () => {
        throw new OrganizationAccessError('accountStatus');
      },
    });
    await settle(fixture);

    accountButton(fixture, arabic.accounts.deactivate).click();
    await settle(fixture);

    expect(text(fixture)).toContain(arabic.problems.accountStatus);
    expect(accountRows(fixture)[0]).toContain(arabic.accounts.active);
  });

  it('lets the operator give a company login a new password', async () => {
    const setLoginPassword = vi.fn<OrganizationRepository['setLoginPassword']>(
      async () => undefined,
    );
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      setLoginPassword,
    });
    await settle(fixture);

    accountButton(fixture, arabic.accounts.changePassword).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const drawer = element.querySelector('app-login-password')!;
    const [email, password] = Array.from(drawer.querySelectorAll('input'));
    expect(email.value).toBe('gulf@example.com');

    fill(password, 'secret9');
    drawer.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(setLoginPassword).toHaveBeenCalledWith('login-gulf', 'secret9');
    expect(element.querySelector('app-login-password')).toBeNull();
    expect(text(fixture)).toContain(arabic.password.changed);
  });

  it('keeps the password drawer open and explains when the password cannot change', async () => {
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      setLoginPassword: async () => {
        throw new OrganizationAccessError('login');
      },
    });
    await settle(fixture);

    accountButton(fixture, arabic.accounts.changePassword).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const drawer = element.querySelector('app-login-password')!;
    fill(drawer.querySelectorAll('input')[1], 'secret9');
    drawer.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(element.querySelector('app-login-password')?.textContent).toContain(
      arabic.problems.login,
    );
  });

  it('lets the operator record a subscription payment in the company currency', async () => {
    const recordSubscriptionPayment = vi.fn<
      OrganizationRepository['recordSubscriptionPayment']
    >(async () => gulfPayment);
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf, quiet],
      recordSubscriptionPayment,
    });
    await settle(fixture);
    expect(payments(fixture).textContent).toContain(arabic.payments.empty);

    paymentsButton(fixture, arabic.payments.add).click();
    await settle(fixture);
    const element: HTMLElement = fixture.nativeElement;
    const paymentForm = element.querySelector('app-payment-form')!;
    const company = paymentForm.querySelector('select')!;
    company.value = 'org-gulf';
    company.dispatchEvent(new Event('change'));
    company.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(paymentForm.textContent).toContain(arabic.currencies.SAR);
    fill(paymentForm.querySelector('input[inputmode="decimal"]')!, '400');
    paymentForm.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(recordSubscriptionPayment).toHaveBeenCalledWith(gulf, {
      organizationId: 'org-gulf',
      paidOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      coversMonth: thisMonth,
      amount: '400',
      note: '',
    });
    expect(payments(fixture).textContent).toContain(arabic.payments.recorded);
    expect(payments(fixture).textContent).toContain('400.00');
    expect(paymentRows(fixture, 'payments-month')[0]).toContain('Gulf Transport');
    expect(paymentRows(fixture, 'payments-companies')[0]).toContain('Gulf Transport');
  });

  it('shows each payment of the month and deletes one only after a second press', async () => {
    const removeSubscriptionPayment = vi.fn<
      OrganizationRepository['removeSubscriptionPayment']
    >(async () => undefined);
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      listSubscriptionPayments: async () => [gulfPayment],
      removeSubscriptionPayment,
    });
    await settle(fixture);
    expect(paymentRows(fixture, 'payments-month')[0]).toContain('Bank transfer');

    paymentsButton(fixture, arabic.payments.remove).click();
    await settle(fixture);
    expect(removeSubscriptionPayment).not.toHaveBeenCalled();

    paymentsButton(fixture, arabic.payments.confirmRemove).click();
    await settle(fixture);

    expect(removeSubscriptionPayment).toHaveBeenCalledWith('payment-1');
    expect(payments(fixture).textContent).toContain(arabic.payments.removed);
    expect(paymentRows(fixture, 'payments-month')).toHaveLength(0);
  });

  it('moves to another month that has no payments', async () => {
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      listSubscriptionPayments: async () => [gulfPayment],
    });
    await settle(fixture);

    paymentsButton(fixture, arabic.payments.previous).click();
    await settle(fixture);

    expect(payments(fixture).textContent).toContain(arabic.payments.noMonthPayments);
    expect(paymentRows(fixture, 'payments-companies')[0]).toContain('Gulf Transport');
  });

  it('shows a safe error when the payments cannot load and tries again', async () => {
    const listSubscriptionPayments = vi
      .fn<OrganizationRepository['listSubscriptionPayments']>()
      .mockRejectedValueOnce(new SubscriptionPaymentError('load'))
      .mockResolvedValueOnce([gulfPayment]);
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts: async () => [gulf],
      listSubscriptionPayments,
    });
    await settle(fixture);
    expect(payments(fixture).textContent).toContain(arabic.payments.problems.load);

    paymentsButton(fixture, arabic.payments.retry).click();
    await settle(fixture);

    expect(paymentRows(fixture, 'payments-month')).toHaveLength(1);
  });

  it('does not load subscription payments for a company login', async () => {
    const listSubscriptionPayments = vi.fn(async () => [gulfPayment]);
    const fixture = await render({ listMine: async () => [north], listSubscriptionPayments });
    await settle(fixture);

    expect(listSubscriptionPayments).not.toHaveBeenCalled();
    expect(text(fixture)).not.toContain(arabic.payments.title);
  });

  it('tells a stopped company to contact the site manager instead of opening its sections', async () => {
    const fixture = await render({
      listMine: async () => [{ ...north, isActive: false }],
    });
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(text(fixture)).toContain(arabic.home.suspendedTitle);
    expect(text(fixture)).toContain(arabic.home.suspended);
    expect(element.querySelector('a[href="/organizations/org-north/routes"]')).toBeNull();
    expect(element.querySelector('.dashboard-today')).toBeNull();
  });

  it('does not list company accounts for a company login', async () => {
    const listCompanyAccounts = vi.fn(async () => [gulf]);
    const fixture = await render({ listMine: async () => [north], listCompanyAccounts });
    await settle(fixture);

    expect(listCompanyAccounts).not.toHaveBeenCalled();
    expect(text(fixture)).not.toContain(arabic.accounts.title);
  });

  it('shows the screen in English after switching language', async () => {
    const fixture = await render({ listMine: async () => [north] });
    await settle(fixture);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(fixture);

    expect(text(fixture)).toContain('Welcome, North');
    expect(text(fixture)).toContain(organizationsText.en.home.customers);
    expect(text(fixture)).toContain(organizationsText.en.home.vehicles);
    expect(text(fixture)).toContain(organizationsText.en.home.drivers);
    expect(text(fixture)).toContain(organizationsText.en.home.routes);
    expect(text(fixture)).toContain(organizationsText.en.home.operations);
  });
});

async function render(overrides: Partial<OrganizationRepository>) {
  const repository: OrganizationRepository = {
    isConfigured: () => true,
    signIn: async () => undefined,
    signOut: async () => undefined,
    listMine: async () => [],
    currentUserIsOperator: async () => false,
    listCompanyAccounts: async () => [],
    setCompanyActive: async () => undefined,
    provisionCompany: async () => undefined,
    setLoginPassword: async () => undefined,
    listSubscriptionPayments: async () => [],
    recordSubscriptionPayment: async () => {
      throw new Error('not used');
    },
    removeSubscriptionPayment: async () => undefined,
    dashboard: async () => busy,
    ...overrides,
  };
  await TestBed.configureTestingModule({
    imports: [Organizations],
    providers: [
      provideRouter([]),
      { provide: OrganizationRepository, useValue: repository },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(Organizations);
  fixture.detectChanges();
  return fixture;
}

async function settle(fixture: ComponentFixture<Organizations>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
}

function fill(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function text(fixture: ComponentFixture<Organizations>): string {
  return fixture.nativeElement.textContent;
}

function accountButton(
  fixture: ComponentFixture<Organizations>,
  label: string,
): HTMLButtonElement {
  const element: HTMLElement = fixture.nativeElement;
  return [
    ...element.querySelectorAll<HTMLButtonElement>('app-company-accounts tbody button'),
  ].find((button) => button.textContent?.trim() === label)!;
}

function accountRows(fixture: ComponentFixture<Organizations>): string[] {
  const element: HTMLElement = fixture.nativeElement;
  return [...element.querySelectorAll('app-company-accounts tbody tr')].map(
    (row) => row.textContent ?? '',
  );
}

function payments(fixture: ComponentFixture<Organizations>): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector('app-subscription-payments')!;
}

function paymentsButton(
  fixture: ComponentFixture<Organizations>,
  label: string,
): HTMLButtonElement {
  return [...payments(fixture).querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === label,
  )!;
}

function paymentRows(fixture: ComponentFixture<Organizations>, table: string): string[] {
  return [...payments(fixture).querySelectorAll(`.${table} tbody tr`)].map(
    (row) => row.textContent ?? '',
  );
}
