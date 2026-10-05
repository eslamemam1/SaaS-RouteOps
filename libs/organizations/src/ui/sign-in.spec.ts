import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { organizationsText } from './organizations-text';
import { SignIn } from './sign-in';

const arabic = organizationsText.ar;

describe('SignIn', () => {
  beforeEach(() => localStorage.clear());

  it('asks for the email and password before signing in', async () => {
    const signIn = vi.fn(async () => undefined);
    const fixture = await render({ signIn });

    submit(fixture);
    await settle(fixture);

    expect(signIn).not.toHaveBeenCalled();
    expect(text(fixture)).toContain(arabic.problems.email);
  });

  it('shows a safe message when the sign in fails', async () => {
    const fixture = await render({
      signIn: async () => {
        throw new OrganizationAccessError('signIn');
      },
    });

    const [email, password] = inputs(fixture);
    fill(email, 'owner@example.com');
    fill(password, 'secret1');
    submit(fixture);
    await settle(fixture);

    expect(text(fixture)).toContain(arabic.problems.signIn);
  });

  it('switches the page to English without the app shell', async () => {
    const fixture = await render({});

    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('app-language-switch button')!.click();
    await settle(fixture);

    expect(text(fixture)).toContain(organizationsText.en.signIn.title);
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
    imports: [SignIn],
    providers: [
      provideRouter([]),
      { provide: OrganizationRepository, useValue: repository },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SignIn);
  fixture.detectChanges();
  return fixture;
}

async function settle(fixture: ComponentFixture<SignIn>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await fixture.whenStable();
  fixture.detectChanges();
}

function inputs(fixture: ComponentFixture<SignIn>): HTMLInputElement[] {
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('input')];
}

function fill(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(fixture: ComponentFixture<SignIn>): void {
  (fixture.nativeElement as HTMLElement)
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { cancelable: true }));
}

function text(fixture: ComponentFixture<SignIn>): string {
  return fixture.nativeElement.textContent;
}
