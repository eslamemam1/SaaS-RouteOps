import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { VehicleAccessError } from '../application/vehicle-access-error';
import {
  VehicleRepository,
  VehicleWork,
} from '../application/vehicle-repository';
import {
  emptyVehicleDetails,
  Vehicle,
  VehicleOrganization,
} from '../domain/vehicle';
import { monthOf, VehicleMonth, VehicleTrip } from '../domain/vehicle-month';
import { VehiclePage } from './vehicle-page';
import { vehiclesText } from './vehicles-text';

const north: VehicleOrganization = {
  id: 'org-north',
  name: 'North',
  currency: 'EGP',
};
const hiace: Vehicle = {
  ...emptyVehicleDetails,
  id: 'vehicle-1',
  plateNumber: 'أ ب ج 1234',
  type: 'microbus',
  ownership: 'rented',
  ownerName: 'مكتب النور',
  rentType: 'perTrip',
  outboundRent: '30',
  returnRent: '30',
};
const work: VehicleWork = {
  choices: {
    customers: [{ id: 'customer-1', label: 'شركة النور' }],
    routes: [{ id: 'route-1', label: 'التجمع الخامس' }],
    drivers: [
      { id: 'driver-1', label: 'أحمد محمد' },
      { id: 'driver-2', label: 'كريم علي' },
    ],
  },
  routes: [
    {
      id: 'route-1',
      name: 'التجمع الخامس',
      customerId: 'customer-1',
      driverId: 'driver-1',
      outboundTime: '07:00',
      returnTime: '16:00',
    },
  ],
};
const trip: VehicleTrip = {
  id: 'trip-1',
  serviceDate: '2026-02-01',
  departureTime: '07:00',
  direction: 'outbound',
  customerId: 'customer-1',
  routeId: 'route-1',
  driverId: 'driver-1',
  extra: false,
  status: 'done',
  reason: '',
  notes: '',
  price: 50000,
  halves: 1,
};
const february: VehicleMonth = {
  trips: [
    trip,
    {
      ...trip,
      id: 'trip-2',
      direction: 'return',
      departureTime: '16:00',
      driverId: 'driver-2',
    },
    {
      ...trip,
      id: 'trip-3',
      serviceDate: '2026-02-02',
      status: 'cancelled',
      reason: 'vehicleBreakdown',
    },
  ],
  rent: {
    vehicleId: 'vehicle-1',
    contractor: false,
    rentType: 'perTrip',
    monthlyRent: null,
    tripRent: { outbound: 3000, return: 3000 },
    done: { outbound: 1, return: 1 },
    recorded: 2000,
  },
  expenses: [
    { category: 'fuel', total: 40000 },
    { category: 'maintenance', total: 10000 },
  ],
  unopenedDays: [],
};
const arabic = vehiclesText.ar;
const thisMonth = monthOf(localDate(new Date()));

describe('VehiclePage', () => {
  it("shows the vehicle, the month's trips, its expenses, profit, and the rent still due", async () => {
    const harness = await open(
      { month: async () => february },
      '?month=2026-02',
    );
    await settle(harness);

    const page = text(harness);
    expect(page).toContain('أ ب ج 1234');
    expect(page).toContain(`${arabic.page.monthTitle} فبراير 2026`);
    expect(statValue(harness, arabic.page.done)).toBe('1');
    expect(statValue(harness, arabic.page.revenue)).toContain('1,000.00');
    expect(statValue(harness, arabic.page.expenses)).toContain('500.00');
    expect(statValue(harness, arabic.page.profit)).toContain('500.00');
    expect(page).toContain('كريم علي');
    expect(page).toContain(arabic.reasons.vehicleBreakdown);
    expect(page).toContain(arabic.categories.maintenance);
    expect(page).toContain(arabic.page.remaining);
    expect(page).toContain('40.00');
  });

  it('opens the month asked for and moves to the month before it', async () => {
    const month = vi.fn<VehicleRepository['month']>(async () => february);
    const harness = await open({ month }, '?month=2026-02');
    await settle(harness);

    button(harness, arabic.page.previous)?.click();
    await settle(harness);

    expect(month.mock.calls.map((call) => call[2])).toEqual([
      '2026-02',
      '2026-01',
    ]);
    expect(text(harness)).toContain(`${arabic.page.monthTitle} يناير 2026`);
  });

  it('opens the current month by default', async () => {
    const month = vi.fn(async () => february);
    await settle(await open({ month }));

    expect(month).toHaveBeenCalledWith(
      north,
      'vehicle-1',
      thisMonth,
      expect.any(String),
    );
  });

  it('says so when the month has no trips or expenses, and hides rent for a vehicle without it', async () => {
    const harness = await open({
      month: async () => ({
        trips: [],
        rent: null,
        expenses: [],
        unopenedDays: [],
      }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.noTrips);
    expect(text(harness)).toContain(arabic.page.noExpenses);
    expect(text(harness)).not.toContain(arabic.page.rentTitle);
  });

  it('warns about working days nobody opened', async () => {
    const harness = await open({
      month: async () => ({ ...february, unopenedDays: ['2026-02-03'] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.unopenedTitle);
    expect(text(harness)).toContain('3 فبراير 2026');
  });

  it('says the vehicle was not found', async () => {
    const month = vi.fn(async () => february);
    const harness = await open({ vehicle: async () => null, month });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.notFound);
    expect(month).not.toHaveBeenCalled();
  });

  it('lets the member try a month again after it fails to load', async () => {
    let fail = true;
    const harness = await open({
      month: async () => {
        if (fail) {
          throw new VehicleAccessError('load');
        }
        return february;
      },
    });
    await settle(harness);
    expect(text(harness)).toContain(arabic.page.loadFailed);

    fail = false;
    button(harness, 'إعادة المحاولة')?.click();
    await settle(harness);

    expect(statValue(harness, arabic.page.done)).toBe('1');
  });
});

async function open(overrides: Partial<VehicleRepository>, query = '') {
  const repository: VehicleRepository = {
    organization: async () => north,
    list: async () => [hiace],
    vehicle: async () => hiace,
    work: async () => work,
    month: async () => february,
    add: async () => hiace,
    update: async () => hiace,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'organizations/:organizationId/vehicles/:vehicleId',
          component: VehiclePage,
        },
      ]),
      { provide: VehicleRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(
    `/organizations/org-north/vehicles/vehicle-1${query}`,
    VehiclePage,
  );
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  for (let turn = 0; turn < 4; turn++) {
    await Promise.resolve();
  }
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

function statValue(harness: RouterTestingHarness, label: string): string {
  const stat = [
    ...(harness.routeNativeElement?.querySelectorAll('.ro-stat') ?? []),
  ].find(
    (item) =>
      item.querySelector('.ro-stat-label')?.textContent?.trim() === label,
  );
  return stat?.querySelector('.ro-stat-value')?.textContent?.trim() ?? '';
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
