import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  DailyTrip,
  OperationChoices,
  OperationsOrganization,
} from '../domain/daily-trip';
import { DailyOperations } from './daily-operations';
import { operationsText } from './operations-text';

const north: OperationsOrganization = { id: 'org-north', name: 'North' };
const choices: OperationChoices = {
  customers: [{ id: 'customer-1', label: 'Delta Factory', active: true }],
  vehicles: [{ id: 'vehicle-1', label: 'ABC 1234', active: true }],
  drivers: [{ id: 'driver-1', label: 'Ahmed', active: true }],
  routes: [{ id: 'route-1', label: 'Delta - Nasr City', active: true }],
};
const outbound: DailyTrip = {
  id: 'trip-1',
  routeId: 'route-1',
  serviceDate: '2000-01-01',
  direction: 'outbound',
  departureTime: '07:00',
  customerId: 'customer-1',
  vehicleId: 'vehicle-1',
  driverId: 'driver-1',
  cancelled: false,
  reason: '',
  notes: '',
  done: false,
};
const cancelledReturn: DailyTrip = {
  ...outbound,
  id: 'trip-2',
  direction: 'return',
  departureTime: '16:00',
  driverId: '',
  cancelled: true,
  reason: 'vehicleBreakdown',
};
const arabic = operationsText.ar;

describe('DailyOperations', () => {
  beforeEach(() => localStorage.clear());

  it('shows loading and then the day trips with their status and reason', async () => {
    let resolveDay: (trips: DailyTrip[]) => void = () => undefined;
    const harness = await open({
      day: () =>
        new Promise((resolve) => {
          resolveDay = resolve;
        }),
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.day.loading);

    resolveDay([cancelledReturn, outbound]);
    await settle(harness);

    expect(text(harness)).toContain('Delta - Nasr City');
    expect(text(harness)).toContain('Delta Factory');
    expect(text(harness)).toContain(arabic.statuses.done);
    expect(text(harness)).toContain(arabic.statuses.cancelled);
    expect(text(harness)).toContain(arabic.reasons.vehicleBreakdown);
    expect(text(harness)).toContain(arabic.day.notSet);
  });

  it('records trips automatically by default, without done buttons', async () => {
    const harness = await open({ day: async () => [outbound] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.recording.title);
    expect(pressed(harness)).toBe(arabic.recording.modes.automatic);
    expect(text(harness)).toContain(arabic.recording.modeHints.automatic);
    expect(button(harness, arabic.day.markDone)).toBeUndefined();
    expect(text(harness)).toContain(arabic.statuses.done);
  });

  it('lets a member mark each trip done when recording is manual', async () => {
    const markDone = vi.fn(async () => ({ ...outbound, done: true }));
    const harness = await open({
      tripRecording: async () => 'manual',
      day: async () => [outbound, cancelledReturn],
      markDone,
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.statuses.unrecorded);
    expect(buttons(harness, arabic.day.markDone)).toHaveLength(1);

    button(harness, arabic.day.markDone)?.click();
    await settle(harness);

    expect(markDone).toHaveBeenCalledWith(north, 'trip-1', true);
    expect(text(harness)).not.toContain(arabic.statuses.unrecorded);
    expect(button(harness, arabic.day.undoDone)).toBeDefined();
  });

  it('saves the chosen recording for the organization', async () => {
    const chooseTripRecording = vi.fn(async () => undefined);
    const harness = await open({
      day: async () => [outbound],
      chooseTripRecording,
    });
    await settle(harness);

    button(harness, arabic.recording.modes.manual)?.click();
    await settle(harness);

    expect(chooseTripRecording).toHaveBeenCalledWith(north, 'manual');
    expect(pressed(harness)).toBe(arabic.recording.modes.manual);
    expect(button(harness, arabic.day.markDone)).toBeDefined();
  });

  it('keeps the previous recording when saving the choice fails', async () => {
    const harness = await open({
      day: async () => [outbound],
      chooseTripRecording: async () => {
        throw new OperationsAccessError('save');
      },
    });
    await settle(harness);

    button(harness, arabic.recording.modes.manual)?.click();
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.save);
    expect(pressed(harness)).toBe(arabic.recording.modes.automatic);
    expect(button(harness, arabic.day.markDone)).toBeUndefined();
  });

  it('offers the companies with running trips for a holiday', async () => {
    const harness = await open({ day: async () => [outbound] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.holiday.title);
    expect(text(harness)).toContain(arabic.holiday.submit);
  });

  it('shows an empty state on a day without trips', async () => {
    const harness = await open({ day: async () => [] });
    await settle(harness);

    expect(text(harness)).toContain(arabic.day.empty);
  });

  it('loads the next day when moving forward', async () => {
    const day = vi.fn(async () => [] as DailyTrip[]);
    const harness = await open({ day });
    await settle(harness);

    const next = [...harness.routeNativeElement!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === arabic.day.next,
    );
    next?.click();
    await settle(harness);

    expect(day).toHaveBeenCalledTimes(2);
    const calls = day.mock.calls as unknown as [OperationsOrganization, string][];
    const [first, second] = calls.map(([, serviceDate]) => serviceDate);
    expect(new Date(second).getTime() - new Date(first).getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  it('refuses an organization outside the user memberships', async () => {
    const day = vi.fn(async () => [outbound]);
    const harness = await open({ organization: async () => null, day });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.organization);
    expect(day).not.toHaveBeenCalled();
  });

  it('shows a safe error when the day cannot load', async () => {
    const harness = await open({
      day: async () => {
        throw new OperationsAccessError('load');
      },
    });
    await settle(harness);

    expect(text(harness)).toContain(arabic.problems.load);
  });

  it('shows the day in English after switching language', async () => {
    const harness = await open({ day: async () => [outbound] });
    await settle(harness);

    TestBed.inject(LanguageService).setLanguage('en');
    await settle(harness);

    expect(text(harness)).toContain(operationsText.en.day.title);
    expect(text(harness)).toContain(operationsText.en.directions.outbound);
  });
});

async function open(overrides: Partial<OperationsRepository>) {
  const repository: OperationsRepository = {
    organization: async () => north,
    day: async () => [],
    choices: async () => choices,
    tripRecording: async () => 'automatic',
    chooseTripRecording: async () => undefined,
    changeTrip: async () => outbound,
    markDone: async () => outbound,
    cancelForHoliday: async () => [],
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'organizations/:organizationId/operations',
          component: DailyOperations,
        },
      ]),
      { provide: OperationsRepository, useValue: repository },
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(
    '/organizations/org-north/operations',
    DailyOperations,
  );
  return harness;
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  for (let step = 0; step < 4; step++) {
    await Promise.resolve();
  }
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function pressed(harness: RouterTestingHarness): string {
  return (
    harness.routeNativeElement
      ?.querySelector('.toggle button[aria-pressed="true"]')
      ?.textContent?.trim() ?? ''
  );
}

function buttons(
  harness: RouterTestingHarness,
  label: string,
): HTMLButtonElement[] {
  return [
    ...(harness.routeNativeElement?.querySelectorAll('button') ?? []),
  ].filter((item) => item.textContent?.trim() === label);
}

function button(
  harness: RouterTestingHarness,
  label: string,
): HTMLButtonElement | undefined {
  return buttons(harness, label)[0];
}

function text(harness: RouterTestingHarness): string {
  return harness.routeNativeElement?.textContent ?? '';
}
