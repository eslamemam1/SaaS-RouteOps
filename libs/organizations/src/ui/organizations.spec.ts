import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { Organizations } from './organizations';

const north: Organization = { id: 'org-north', name: 'North' };

describe('Organizations', () => {
  it('shows loading and then the assigned organization', async () => {
    let resolveList: (organizations: Organization[]) => void = () => undefined;
    const fixture = await render({
      listMine: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });

    expect(text(fixture)).toContain('Loading organizations.');

    resolveList([north]);
    await Promise.resolve();
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Active organization: North');
  });

  it('shows an empty state when the account has no organization', async () => {
    const fixture = await render({
      listMine: async () => [],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain(
      'No organization is assigned to this account.',
    );
  });

  it('shows a safe error when loading fails', async () => {
    const fixture = await render({
      listMine: async () => {
        throw new OrganizationAccessError('Could not load organizations.');
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Could not load organizations.');
    expect(text(fixture)).not.toContain('select ');
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

function text(fixture: ComponentFixture<Organizations>): string {
  return fixture.nativeElement.textContent;
}
