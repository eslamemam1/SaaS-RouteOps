import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import { Vehicle, VehicleOrganization } from '../domain/vehicle';
import { Vehicles } from './vehicles';
import { vehiclesText } from './vehicles-text';

const north: VehicleOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
const hiace: Vehicle = {
  id: 'vehicle-1',
  plateNumber: 'أ ب ج 1234',
  type: 'microbus',
  model: 'Toyota Hiace',
  year: '2020',
  seats: '14',
  licenseExpiry: '2000-01-01',
  ownership: 'owned',
  ownerName: '',
  ownerPhone: '',
  rentType: 'none',
  monthlyRent: '',
  outboundRent: '',
  returnRent: '',
  notes: '',
  active: true,
};
const rentedBus: Vehicle = {
  ...hiace,
  id: 'vehicle-2',
  plateNumber: 'د هـ و 5678',
  type: 'bus',
  model: 'Mercedes',
  ownership: 'rented',
  ownerName: 'مكتب النور',
  ownerPhone: '01001234567',
};
const arabic = vehiclesText.ar;

describe('Vehicles', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the organization vehicles', async () => {
    let resolveList: (vehicles: Vehicle[]) => void = () => undefined;
    const harness = await open({
      list: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.loading);

    resolveList([hiace]);
    await settle(harness);

    expect(text(harness)).toContain('Toyota Hiace');
    expect(text(harness)).toContain(arabic.types.microbus);
    expect(text(harness)).toContain(arabic.list.inService);
  });

  it('marks a license whose expiry date has passed', async () => {
    const harness = await open({ list: async () => [hiace] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.expired);
  });

  it('shows who owns a rented vehicle and filters by ownership', async () => {
    const harness = await open({ list: async () => [hiace, rentedBus] });
    await settle(harness);

    expect(text(harness)).toContain('مكتب النور');
    expect(rows(harness)).toHaveLength(2);

    const [filter] = all<HTMLSelectElement>(harness, 'select');
    fill(filter, 'rented', 'change');
    await settle(harness);

    expect(rows(harness)).toHaveLength(1);
    expect(text(harness)).toContain('Mercedes');
    expect(text(harness)).not.toContain('Toyota Hiace');

    fill(filter, 'contractor', 'change');
    await settle(harness);

    expect(rows(harness)).toHaveLength(0);
    expect(text(harness)).toContain(arabic.list.noMatch);
  });

  it('asks for the owner before adding a rented vehicle', async () => {
    const add = vi.fn(async () => rentedBus);
    const harness = await open({ list: async () => [], add });
    await settle(harness);
    button(harness, arabic.list.add)?.click();
    await settle(harness);

    const [plate] = all<HTMLInputElement>(harness, 'form input[type="text"]');
    const [type, ownership] = all<HTMLSelectElement>(harness, 'form select');
    fill(plate, 'د هـ و 5678', 'input');
    fill(type, 'bus', 'input');
    fill(ownership, 'rented', 'input');
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.ownerName);
    submit(harness);
    await settle(harness);

    expect(add).not.toHaveBeenCalled();
    expect(text(harness)).toContain(arabic.problems.ownerName);

    const ownerName = all<HTMLInputElement>(harness, 'form input[type="text"]').at(-1)!;
    fill(ownerName, 'مكتب النور', 'input');
    fill(all<HTMLInputElement>(harness, 'form input[type="tel"]')[0], '01001234567', 'input');
    await settle(harness);
    submit(harness);
    await settle(harness);

    expect(add).toHaveBeenCalledWith(
      north,
      expect.objectContaining({
        ownership: 'rented',
        ownerName: 'مكتب النور',
        ownerPhone: '01001234567',
      }),
    );
    expect(harness.routeNativeElement?.querySelector('form')).toBeFalsy();
    expect(text(harness)).toContain(arabic.form.added);
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

  it('refuses an organization outside the user memberships', async () => {
    const list = vi.fn(async () => [hiace]);
    const harness = await open({ organization: async () => null, list });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows a safe error when loading fails', async () => {
    const harness = await open({
      list: async () => {
        throw new VehicleAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it('shows the list in English after switching language', async () => {
    const harness = await open({ list: async () => [hiace] });
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(vehiclesText.en.list.title);
    expect(text(harness)).toContain(vehiclesText.en.types.microbus);
  });
});

async function open(overrides: Partial<VehicleRepository>) {
  const repository: VehicleRepository = {
    organization: async () => north,
    list: async () => [],
    add: async () => hiace,
    update: async () => hiace,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'organizations/:organizationId/vehicles', component: Vehicles },
      ]),
      { provide: VehicleRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/vehicles', Vehicles);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}

function button(
  harness: RouterTestingHarness,
  label: string,
): HTMLButtonElement | undefined {
  return all<HTMLButtonElement>(harness, 'button').find(
    (item) => item.textContent?.trim() === label,
  );
}

function rows(harness: RouterTestingHarness): HTMLTableRowElement[] {
  return [
    ...(harness.routeNativeElement?.querySelectorAll<HTMLTableRowElement>(
      'tbody tr',
    ) ?? []),
  ];
}

function all<Element extends HTMLElement>(
  harness: RouterTestingHarness,
  selector: string,
): Element[] {
  return [...(harness.routeNativeElement?.querySelectorAll<Element>(selector) ?? [])];
}

function fill(
  field: HTMLInputElement | HTMLSelectElement,
  value: string,
  event: 'input' | 'change',
): void {
  field.value = value;
  field.dispatchEvent(new Event(event));
}

function submit(harness: RouterTestingHarness): void {
  harness.routeNativeElement!
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { cancelable: true }));
}
