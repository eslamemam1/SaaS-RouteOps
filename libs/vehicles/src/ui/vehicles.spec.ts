import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import { Vehicle, VehicleOrganization } from '../domain/vehicle';
import { Vehicles } from './vehicles';
import { vehiclesText } from './vehicles-text';

const north: VehicleOrganization = { id: 'org-north', name: 'North' };
const hiace: Vehicle = {
  id: 'vehicle-1',
  plateNumber: 'أ ب ج 1234',
  type: 'microbus',
  model: 'Toyota Hiace',
  year: '2020',
  seats: '14',
  licenseExpiry: '2000-01-01',
  notes: '',
  active: true,
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

  it('shows an empty state and the add form when there are no vehicles', async () => {
    const harness = await open({ list: async () => [] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.empty);
    expect(text(harness)).toContain(arabic.form.addTitle);
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
