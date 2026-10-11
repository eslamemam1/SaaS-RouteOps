import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository } from '../application/driver-repository';
import { Driver, DriverOrganization } from '../domain/driver';
import { Drivers } from './drivers';
import { driversText } from './drivers-text';

const north: DriverOrganization = {
  id: 'org-north',
  name: 'North',
  currency: 'EGP',
};
const ahmed: Driver = {
  id: 'driver-1',
  fullName: 'أحمد محمد',
  phone: '0100',
  nationalId: '29001011234567',
  licenseNumber: 'L-55',
  licenseExpiry: '2000-01-01',
  payType: 'none',
  monthlySalary: '',
  salaryTrips: '',
  outboundPay: '',
  returnPay: '',
  notes: '',
  active: true,
  photo: null,
};
const arabic = driversText.ar;

describe('Drivers', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the organization drivers', async () => {
    let resolveList: (drivers: Driver[]) => void = () => undefined;
    const harness = await open({
      list: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.loading);

    resolveList([ahmed]);
    await settle(harness);

    expect(text(harness)).toContain('أحمد محمد');
    expect(text(harness)).toContain(arabic.list.working);
  });

  it('marks a driving license whose expiry date has passed', async () => {
    const harness = await open({ list: async () => [ahmed] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.expired);
  });

  it('shows an empty state that opens the add form', async () => {
    const harness = await open({ list: async () => [] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.empty);
    expect(harness.routeNativeElement?.querySelector('form')).toBeFalsy();

    button(harness, arabic.list.add)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.addTitle);
    expect(harness.routeNativeElement?.querySelector('form')).toBeTruthy();
  });

  it('opens the form with the driver details to edit', async () => {
    const harness = await open({ list: async () => [ahmed] });
    await settle(harness);

    button(harness, arabic.list.edit)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.editTitle);
    const name = harness.routeNativeElement!.querySelector<HTMLInputElement>(
      'form input[type="text"]',
    );
    expect(name?.value).toBe('أحمد محمد');
  });

  it('refuses an organization outside the user memberships', async () => {
    const list = vi.fn(async () => [ahmed]);
    const harness = await open({ organization: async () => null, list });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows a safe error when loading fails', async () => {
    const harness = await open({
      list: async () => {
        throw new DriverAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it("shows a driver's photo, or the initials of a driver without one", async () => {
    const omar: Driver = {
      ...ahmed,
      id: 'driver-2',
      fullName: 'عمر خالد',
      photo: {
        path: 'org-north/driver-2/photo.webp',
        url: 'https://example.test/omar.webp',
      },
    };
    const harness = await open({ list: async () => [ahmed, omar] });
    await settle(harness);

    const avatars = [
      ...(harness.routeNativeElement?.querySelectorAll('app-avatar') ?? []),
    ];
    expect(avatars).toHaveLength(2);
    expect(avatars[0].textContent?.trim()).toBe('أم');
    expect(avatars[1].querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/omar.webp',
    );
  });

  it('shows the list in English after switching language', async () => {
    const harness = await open({ list: async () => [ahmed] });
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(driversText.en.list.title);
    expect(text(harness)).toContain(driversText.en.list.working);
  });
});

async function open(overrides: Partial<DriverRepository>) {
  const repository: DriverRepository = {
    organization: async () => north,
    list: async () => [],
    add: async () => ahmed,
    update: async () => ahmed,
    setPhoto: async () => ahmed,
    removePhoto: async () => ahmed,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'organizations/:organizationId/drivers', component: Drivers },
      ]),
      { provide: DriverRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/drivers', Drivers);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function button(
  harness: RouterTestingHarness,
  label: string,
): HTMLButtonElement | undefined {
  return [
    ...(harness.routeNativeElement?.querySelectorAll<HTMLButtonElement>(
      'button',
    ) ?? []),
  ].find((item) => item.textContent?.trim() === label);
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
