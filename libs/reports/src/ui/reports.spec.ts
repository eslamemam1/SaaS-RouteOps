import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import { ReportsAccessError } from '../application/reports-access-error';
import { ReportsRepository } from '../application/reports-repository';
import { MonthReport, ReportChoices, ReportOrganization } from '../domain/trip-report';
import { Reports } from './reports';
import { reportsText } from './reports-text';

const north: ReportOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };
const choices: ReportChoices = {
  customers: [
    { id: 'delta', label: 'Delta Factory' },
    { id: 'nour', label: 'Nour Company' },
  ],
  vehicles: [
    { id: 'bus-1', label: 'ABC 1234', ownership: 'owned', ownerName: '' },
    { id: 'van-2', label: 'XYZ 99', ownership: 'contractor', ownerName: 'Mohamed Ali' },
  ],
  routes: [{ id: 'route-1', label: 'Maadi line', customerId: 'delta' }],
  drivers: [{ id: 'ahmed', label: 'Ahmed' }],
};
const october: MonthReport = {
  counts: [
    { customerId: 'delta', routeId: 'route-1', vehicleId: 'bus-1', driverId: 'ahmed', done: 40, extra: 0, revenue: 600000, unpriced: 0 },
    { customerId: 'nour', routeId: '', vehicleId: 'van-2', driverId: '', done: 22, extra: 3, revenue: 0, unpriced: 0 },
  ],
  expenses: [],
  unopenedDays: [],
  unrecorded: { drivers: 0, vehicles: 0 },
};
const arabic = reportsText.ar;

describe('Reports', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the month totals per client company', async () => {
    let resolveMonth: (report: MonthReport) => void = () => undefined;
    const harness = await open({
      month: () =>
        new Promise((resolve) => {
          resolveMonth = resolve;
        }),
    });
    await settle(harness);
    expect(text(harness)).toContain(arabic.report.loading);

    resolveMonth(october);
    await settle(harness);

    expect(text(harness)).toContain('62');
    expect(rows(harness)).toHaveLength(2);
    expect(rows(harness)[0].textContent).toContain('Delta Factory');
    expect(rows(harness)[0].textContent).toContain('40');
  });

  it('shows the vehicles with their ownership, and trips without a driver', async () => {
    const harness = await open({});
    await settle(harness);

    button(harness, arabic.groups.vehicle)?.click();
    await settle(harness);
    expect(rows(harness)[1].textContent).toContain(arabic.ownerships.contractor);
    expect(rows(harness)[1].textContent).toContain('Mohamed Ali');

    button(harness, arabic.groups.driver)?.click();
    await settle(harness);
    expect(rows(harness)[1].textContent).toContain(arabic.missing.driver);
  });

  it('shows the revenue in the organization currency', async () => {
    const harness = await open({});
    await settle(harness);

    expect(text(harness)).toContain(formatMoney(600000, 'EGP', 'ar'));
    expect(rows(harness)[0].textContent).toContain(formatMoney(600000, 'EGP', 'ar'));
    expect(text(harness)).not.toContain(arabic.report.unpricedTitle);
  });

  it('subtracts the month expenses from the revenue, overall and per vehicle', async () => {
    const harness = await open({
      month: async () => ({
        ...october,
        expenses: [
          { category: 'fuel', vehicleId: 'bus-1', driverId: '', total: 100000 },
          { category: 'office', vehicleId: '', driverId: '', total: 50000 },
        ],
      }),
    });
    await settle(harness);

    expect(text(harness)).toContain(formatMoney(150000, 'EGP', 'ar'));
    expect(text(harness)).toContain(formatMoney(450000, 'EGP', 'ar'));

    button(harness, arabic.groups.vehicle)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.vehicleExpensesHint);
    expect(rows(harness)[0].textContent).toContain(formatMoney(500000, 'EGP', 'ar'));
    expect(rows(harness)[2].textContent).toContain(arabic.missing.vehicle);
    expect(rows(harness)[2].textContent).toContain(arabic.report.loss);
  });

  it('shows a month with expenses but no trips', async () => {
    const harness = await open({
      month: async () => ({
        counts: [],
        expenses: [{ category: 'rent', vehicleId: 'van-2', driverId: '', total: 300000 }],
        unopenedDays: [],
        unrecorded: { drivers: 0, vehicles: 0 },
      }),
    });
    await settle(harness);

    expect(text(harness)).not.toContain(arabic.report.empty);
    expect(text(harness)).toContain(formatMoney(-300000, 'EGP', 'ar'));
  });

  it('shows each route with the driver, vehicle, and company shares', async () => {
    const harness = await open({
      month: async () => ({
        ...october,
        counts: [{ ...october.counts[0], revenue: 2500000 }],
        expenses: [
          { category: 'salaries', vehicleId: '', driverId: 'ahmed', total: 500000 },
          { category: 'rent', vehicleId: 'bus-1', driverId: '', total: 1200000 },
          { category: 'office', vehicleId: '', driverId: '', total: 30000 },
        ],
      }),
    });
    await settle(harness);

    button(harness, arabic.groups.route)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.routeHint);
    const [line] = rows(harness);
    expect(line.textContent).toContain('Maadi line');
    expect(line.textContent).toContain('Delta Factory');
    expect(line.textContent).toContain(formatMoney(500000, 'EGP', 'ar'));
    expect(line.textContent).toContain(formatMoney(1200000, 'EGP', 'ar'));
    expect(line.textContent).toContain(formatMoney(800000, 'EGP', 'ar'));
    expect(text(harness)).toContain(arabic.report.otherCosts);
    expect(text(harness)).toContain(formatMoney(30000, 'EGP', 'ar'));
    expect(text(harness)).not.toContain(arabic.report.unrecordedTitle);
  });

  it('warns on the routes view about pay not recorded yet', async () => {
    const harness = await open({
      month: async () => ({ ...october, unrecorded: { drivers: 2, vehicles: 1 } }),
    });
    await settle(harness);

    button(harness, arabic.groups.route)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.unrecordedTitle);
    expect(text(harness)).toContain(arabic.report.unrecordedDrivers);
    expect(text(harness)).toContain(arabic.report.unrecordedVehicles);
  });

  it('warns about done trips without a price', async () => {
    const harness = await open({
      month: async () => ({
        ...october,
        counts: [{ ...october.counts[1], unpriced: 22 }],
      }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.unpricedTitle);
    expect(rows(harness)[0].textContent).toContain(arabic.report.unpricedTrips);
  });

  it('warns about the days nobody opened', async () => {
    const harness = await open({
      month: async () => ({ ...october, unopenedDays: ['2026-10-02', '2026-10-03'] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.unopenedTitle);
    expect(text(harness)).toContain('2026-10-02');
    expect(text(harness)).toContain('2026-10-03');
  });

  it('loads the previous month', async () => {
    const month = vi.fn<ReportsRepository['month']>(async () => october);
    const harness = await open({ month });
    await settle(harness);
    const current = month.mock.calls[0][1];

    button(harness, arabic.report.previous)?.click();
    await settle(harness);

    const previous = month.mock.calls[1][1];
    expect(previous < current).toBe(true);
    expect(button(harness, arabic.report.thisMonth)).toBeTruthy();
  });

  it('shows an empty state for a month without trips', async () => {
    const harness = await open({ month: async () => ({ ...october, counts: [], expenses: [] }) });
    await settle(harness);

    expect(text(harness)).toContain(arabic.report.empty);
  });

  it('refuses an organization outside the user memberships', async () => {
    const month = vi.fn(async () => october);
    const harness = await open({ organization: async () => null, month });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(month).not.toHaveBeenCalled();
  });

  it('shows a safe error when the report cannot load', async () => {
    const harness = await open({
      month: async () => {
        throw new ReportsAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it('shows the report in English after switching language', async () => {
    const harness = await open({});
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(reportsText.en.report.title);
  });
});

async function open(overrides: Partial<ReportsRepository>) {
  const repository: ReportsRepository = {
    organization: async () => north,
    choices: async () => choices,
    month: async () => october,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'organizations/:organizationId/reports', component: Reports },
      ]),
      { provide: ReportsRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/organizations/org-north/reports', Reports);
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
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

function button(harness: RouterTestingHarness, label: string): HTMLButtonElement | undefined {
  return [
    ...(harness.routeNativeElement?.querySelectorAll<HTMLButtonElement>('button') ?? []),
  ].find((item) => item.textContent?.trim() === label);
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
