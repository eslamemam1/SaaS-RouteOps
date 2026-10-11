import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository, DriverWork } from '../application/driver-repository';
import {
  Driver,
  DriverOrganization,
  emptyDriverDetails,
} from '../domain/driver';
import { DriverMonth, DriverTrip, monthOf } from '../domain/driver-month';
import { DriverPage } from './driver-page';
import { driversText } from './drivers-text';

const north: DriverOrganization = {
  id: 'org-north',
  name: 'North',
  currency: 'EGP',
};
const ahmed: Driver = {
  ...emptyDriverDetails,
  id: 'driver-1',
  fullName: 'أحمد محمد',
  phone: '0100',
  payType: 'perTrip',
  outboundPay: '100',
  returnPay: '100',
  photo: null,
};
const work: DriverWork = {
  choices: {
    customers: [{ id: 'customer-1', label: 'شركة النور' }],
    routes: [
      { id: 'route-1', label: 'التجمع الخامس', customerId: 'customer-1' },
    ],
    vehicles: [{ id: 'vehicle-1', label: 'ABC 1234' }],
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
      vehicleId: 'vehicle-1',
      outboundTime: '07:00',
      returnTime: '16:00',
    },
  ],
};
const trip: DriverTrip = {
  id: 'trip-1',
  serviceDate: '2026-02-01',
  departureTime: '07:00',
  direction: 'outbound',
  customerId: 'customer-1',
  routeId: 'route-1',
  vehicleId: 'vehicle-1',
  driverId: 'driver-1',
  plannedDriverId: 'driver-1',
  extra: false,
  status: 'done',
  reason: '',
  notes: '',
  price: 50000,
};
const february: DriverMonth = {
  trips: [
    trip,
    { ...trip, id: 'trip-2', direction: 'return', departureTime: '16:00' },
    {
      ...trip,
      id: 'trip-3',
      serviceDate: '2026-02-02',
      driverId: 'driver-2',
      reason: 'driverAbsent',
    },
  ],
  pay: {
    driverId: 'driver-1',
    payType: 'perTrip',
    monthlySalary: null,
    salaryTrips: null,
    tripPay: { outbound: 10000, return: 10000 },
    done: { outbound: 1, return: 1 },
    absent: { outbound: 1, return: 0 },
    recorded: 5000,
  },
  unopenedDays: [],
};
const arabic = driversText.ar;
const thisMonth = monthOf(localDate(new Date()));

describe('DriverPage', () => {
  it("shows the driver, the month's trips, and the pay still due", async () => {
    const harness = await open(
      { month: async () => february },
      '?month=2026-02',
    );
    await settle(harness);

    const page = text(harness);
    expect(page).toContain('أحمد محمد');
    expect(page).toContain(`${arabic.page.monthTitle} فبراير 2026`);
    expect(statValue(harness, arabic.page.done)).toBe('2');
    expect(statValue(harness, arabic.page.absent)).toBe('1');
    expect(page).toContain(arabic.states.absent);
    expect(page).toContain('كريم علي');
    expect(page).toContain('التجمع الخامس');
    expect(page).toContain(arabic.page.remaining);
    expect(page).toContain('150.00');
  });

  it('opens the month asked for and moves to the month before it', async () => {
    const month = vi.fn<DriverRepository['month']>(async () => february);
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
      'driver-1',
      thisMonth,
      expect.any(String),
    );
  });

  it('says so when the month has no trips', async () => {
    const harness = await open({
      month: async () => ({ trips: [], pay: null, unopenedDays: [] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.noTrips);
    expect(text(harness)).toContain(arabic.page.noPay);
  });

  it('warns about working days nobody opened', async () => {
    const harness = await open({
      month: async () => ({ ...february, unopenedDays: ['2026-02-03'] }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.unopenedTitle);
    expect(text(harness)).toContain('3 فبراير 2026');
  });

  it('says the driver was not found', async () => {
    const month = vi.fn(async () => february);
    const harness = await open({ driver: async () => null, month });
    await settle(harness);

    expect(text(harness)).toContain(arabic.page.notFound);
    expect(month).not.toHaveBeenCalled();
  });

  it('lets the member try a month again after it fails to load', async () => {
    let fail = true;
    const harness = await open({
      month: async () => {
        if (fail) {
          throw new DriverAccessError('load');
        }
        return february;
      },
    });
    await settle(harness);
    expect(text(harness)).toContain(arabic.page.loadFailed);

    fail = false;
    button(harness, 'إعادة المحاولة')?.click();
    await settle(harness);

    expect(statValue(harness, arabic.page.done)).toBe('2');
  });
});

async function open(overrides: Partial<DriverRepository>, query = '') {
  const repository: DriverRepository = {
    organization: async () => north,
    list: async () => [ahmed],
    driver: async () => ahmed,
    work: async () => work,
    month: async () => february,
    add: async () => ahmed,
    update: async () => ahmed,
    setPhoto: async () => ahmed,
    removePhoto: async () => ahmed,
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'organizations/:organizationId/drivers/:driverId',
          component: DriverPage,
        },
      ]),
      { provide: DriverRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(
    `/organizations/org-north/drivers/driver-1${query}`,
    DriverPage,
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
