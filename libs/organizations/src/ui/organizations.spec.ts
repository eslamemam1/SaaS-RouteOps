import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@routeops/shared/i18n';
import { Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { Organizations } from './organizations';
import { organizationsText } from './organizations-text';

const north: Organization = { id: 'org-north', name: 'North' };
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

  it('shows the screen in English after switching language', async () => {
    const fixture = await render({ listMine: async () => [north] });
    await settle(fixture);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(fixture);

    expect(text(fixture)).toContain('Welcome, North');
    expect(text(fixture)).toContain(organizationsText.en.home.customers);
    expect(text(fixture)).toContain(organizationsText.en.home.vehicles);
  });
});

async function render(overrides: Partial<OrganizationRepository>) {
  const repository: OrganizationRepository = {
    isConfigured: () => true,
    signIn: async () => undefined,
    signOut: async () => undefined,
    listMine: async () => [],
    currentUserIsOperator: async () => false,
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

function text(fixture: ComponentFixture<Organizations>): string {
  return fixture.nativeElement.textContent;
}
