import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { RouteAccessError } from '../application/route-access-error';
import { RouteRepository } from '../application/route-repository';
import {
  emptyTransportRouteDetails,
  RouteChoices,
  RouteOrganization,
  TransportRoute,
} from '../domain/transport-route';
import { routesText } from './routes-text';
import { TransportRoutes } from './transport-routes';

const north: RouteOrganization = { id: 'org-north', name: 'North' };
const choices: RouteChoices = {
  customers: [{ id: 'customer-1', label: 'Delta Factory', active: true }],
  vehicles: [{ id: 'vehicle-1', label: 'ABC 1234', active: true }],
  drivers: [{ id: 'driver-1', label: 'Ahmed', active: true }],
};
const delta: TransportRoute = {
  ...emptyTransportRouteDetails,
  id: 'route-1',
  name: 'Delta - Nasr City',
  customerId: 'customer-1',
  vehicleId: 'vehicle-1',
  driverId: '',
  startPoint: 'Hegaz Square',
  endPoint: 'Delta Factory',
  outboundTime: '07:00',
  returnTime: '16:00',
};
const arabic = routesText.ar;

describe('TransportRoutes', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then each route with its company, vehicle, and driver', async () => {
    let resolveList: (routes: TransportRoute[]) => void = () => undefined;
    const harness = await open({
      list: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.loading);

    resolveList([delta]);
    await settle(harness);

    expect(text(harness)).toContain('Delta - Nasr City');
    expect(text(harness)).toContain('Delta Factory');
    expect(text(harness)).toContain('ABC 1234');
    expect(text(harness)).toContain(arabic.list.notSet);
    expect(text(harness)).toContain(arabic.weekdays.saturday);
  });

  it('shows an empty state and the add form when there are no routes', async () => {
    const harness = await open({ list: async () => [] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.list.empty);
    expect(text(harness)).toContain(arabic.form.addTitle);
  });

  it('filters routes with the same name by company', async () => {
    const nour = { id: 'customer-2', label: 'Nour Company', active: true };
    const nourRoute = { ...delta, id: 'route-2', customerId: nour.id };
    const harness = await open({
      list: async () => [delta, nourRoute],
      choices: async () => ({ ...choices, customers: [...choices.customers, nour] }),
    });
    await settle(harness);

    expect(rows(harness)).toHaveLength(2);

    const filter = harness.routeNativeElement!.querySelector('select')!;
    filter.value = nour.id;
    filter.dispatchEvent(new Event('change'));
    await settle(harness);

    expect(rows(harness)).toHaveLength(1);
    expect(rows(harness)[0].textContent).toContain('Nour Company');
  });

  it('starts a copy for another company from an existing route', async () => {
    const harness = await open({ list: async () => [delta] });
    await settle(harness);

    const copy = [...harness.routeNativeElement!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === arabic.list.copy,
    );
    copy?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.copyTitle);
    const name = harness.routeNativeElement!.querySelector<HTMLInputElement>(
      'form input[type="text"]',
    );
    expect(name?.value).toBe('Delta - Nasr City');
  });

  it('points to the client companies page when there are none yet', async () => {
    const harness = await open({
      choices: async () => ({ customers: [], vehicles: [], drivers: [] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.form.noCustomers);
  });

  it('refuses an organization outside the user memberships', async () => {
    const list = vi.fn(async () => [delta]);
    const harness = await open({ organization: async () => null, list });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(list).not.toHaveBeenCalled();
  });

  it('shows a safe error when loading fails', async () => {
    const harness = await open({
      choices: async () => {
        throw new RouteAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it('shows the list in English after switching language', async () => {
    const harness = await open({ list: async () => [delta] });
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(routesText.en.list.title);
    expect(text(harness)).toContain(routesText.en.weekdays.saturday);
  });
});

async function open(overrides: Partial<RouteRepository>) {
  const repository: RouteRepository = {
    organization: async () => north,
    list: async () => [],
    choices: async () => choices,
    add: async () => delta,
    update: async () => delta,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'organizations/:organizationId/routes',
          component: TransportRoutes,
        },
      ]),
      { provide: RouteRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/routes', TransportRoutes);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function rows(harness: RouterTestingHarness): HTMLTableRowElement[] {
  return [
    ...(harness.routeNativeElement?.querySelectorAll<HTMLTableRowElement>(
      'tbody tr',
    ) ?? []),
  ];
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
