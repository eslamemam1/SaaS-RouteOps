import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@routeops/shared/i18n';
import { CompanyAccount, Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { Organizations } from './organizations';
import { organizationsText } from './organizations-text';

const north: Organization = { id: 'org-north', name: 'North', isActive: true };
const gulf: CompanyAccount = {
  id: 'org-gulf',
  name: 'Gulf Transport',
  currency: 'SAR',
  isActive: true,
  logins: ['gulf@example.com'],
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

  it('lets a member of two companies choose which one to open', async () => {
    const south: Organization = { id: 'org-south', name: 'South', isActive: true };
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
    (element.querySelector('app-provision-company form') as HTMLFormElement)
      .dispatchEvent(new Event('submit'));
    await settle(fixture);

    expect(provisionCompany).toHaveBeenCalledWith({
      organizationName: 'Gulf Transport',
      email: 'gulf@example.com',
      password: 'secret1',
      currency: 'SAR',
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

  it('adds a new company to the operator list after creating it', async () => {
    const listCompanyAccounts = vi
      .fn<OrganizationRepository['listCompanyAccounts']>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([gulf]);
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts,
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

    expect(listCompanyAccounts).toHaveBeenCalledTimes(2);
    expect(accountRows(fixture)[0]).toContain('Gulf Transport');
  });

  it('shows a safe error when the company accounts cannot load and tries again', async () => {
    const listCompanyAccounts = vi
      .fn<OrganizationRepository['listCompanyAccounts']>()
      .mockRejectedValueOnce(new OrganizationAccessError('load'))
      .mockResolvedValueOnce([gulf]);
    const fixture = await render({
      currentUserIsOperator: async () => true,
      listCompanyAccounts,
    });
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    const accounts = element.querySelector('app-company-accounts')!;
    expect(accounts.textContent).toContain(arabic.problems.load);

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

  it('tells a stopped company to contact the site manager instead of opening its sections', async () => {
    const fixture = await render({
      listMine: async () => [{ ...north, isActive: false }],
    });
    await settle(fixture);

    const element: HTMLElement = fixture.nativeElement;
    expect(text(fixture)).toContain(arabic.home.suspendedTitle);
    expect(text(fixture)).toContain(arabic.home.suspended);
    expect(element.querySelector('a[href="/organizations/org-north/routes"]')).toBeNull();
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
