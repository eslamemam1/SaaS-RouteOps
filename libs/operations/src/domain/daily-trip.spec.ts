import {
  availableChoices,
  canMarkDone,
  customersWithRunningTrips,
  DailyTrip,
  isServiceDate,
  notesError,
  reasonError,
  shiftDate,
  sortByTime,
  tripStatus,
} from './daily-trip';

const trip = (overrides: Partial<DailyTrip>): DailyTrip => ({
  id: 'trip-1',
  routeId: 'route-1',
  serviceDate: '2026-10-04',
  direction: 'outbound',
  departureTime: '07:00',
  customerId: 'customer-1',
  vehicleId: 'vehicle-1',
  driverId: 'driver-1',
  cancelled: false,
  reason: '',
  notes: '',
  done: false,
  ...overrides,
});

describe('tripStatus', () => {
  const today = '2026-10-04';

  it('counts a trip as done once its day has come, unless cancelled, when recording is automatic', () => {
    expect(tripStatus(trip({ serviceDate: today }), today, 'automatic')).toBe('done');
    expect(tripStatus(trip({ serviceDate: '2026-10-01' }), today, 'automatic')).toBe('done');
    expect(tripStatus(trip({ serviceDate: '2026-10-05' }), today, 'automatic')).toBe('planned');
    expect(
      tripStatus(trip({ cancelled: true, reason: 'holiday' }), today, 'automatic'),
    ).toBe('cancelled');
  });

  it('counts a trip as done only once marked done when recording is manual', () => {
    expect(tripStatus(trip({ serviceDate: today }), today, 'manual')).toBe('unrecorded');
    expect(tripStatus(trip({ serviceDate: '2026-10-01' }), today, 'manual')).toBe('unrecorded');
    expect(tripStatus(trip({ done: true }), today, 'manual')).toBe('done');
    expect(tripStatus(trip({ serviceDate: '2026-10-05' }), today, 'manual')).toBe('planned');
    expect(
      tripStatus(trip({ cancelled: true, reason: 'holiday' }), today, 'manual'),
    ).toBe('cancelled');
  });

  it('keeps a trip marked done as done after switching back to automatic', () => {
    expect(tripStatus(trip({ done: true }), today, 'automatic')).toBe('done');
  });
});

describe('canMarkDone', () => {
  it('allows a trip whose day has come and that is not cancelled', () => {
    expect(canMarkDone(trip({ serviceDate: '2026-10-04' }), '2026-10-04')).toBe(true);
    expect(canMarkDone(trip({ serviceDate: '2026-10-01' }), '2026-10-04')).toBe(true);
    expect(canMarkDone(trip({ serviceDate: '2026-10-05' }), '2026-10-04')).toBe(false);
    expect(
      canMarkDone(trip({ cancelled: true, reason: 'holiday' }), '2026-10-04'),
    ).toBe(false);
  });
});

describe('change reason and notes', () => {
  it('requires a known reason', () => {
    expect(reasonError('')).toBe('reason');
    expect(reasonError('driverAbsent')).toBeNull();
  });

  it('requires notes when the reason is other', () => {
    expect(notesError('  ', 'other')).toBe('otherNotes');
    expect(notesError('Road closed', 'other')).toBeNull();
    expect(notesError('', 'holiday')).toBeNull();
  });

  it('rejects notes over 2000 characters', () => {
    expect(notesError('a'.repeat(2001), 'holiday')).toBe('tooLong');
  });
});

describe('dates', () => {
  it('accepts only real dates', () => {
    expect(isServiceDate('2026-10-04')).toBe(true);
    expect(isServiceDate('2026-02-30')).toBe(false);
    expect(isServiceDate('')).toBe(false);
  });

  it('moves across month ends', () => {
    expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('customersWithRunningTrips', () => {
  it('lists each customer with a trip that is not cancelled, once', () => {
    expect(
      customersWithRunningTrips([
        trip({ id: '1', customerId: 'delta' }),
        trip({ id: '2', customerId: 'delta', direction: 'return' }),
        trip({ id: '3', customerId: 'nour', cancelled: true, reason: 'holiday' }),
      ]),
    ).toEqual(['delta']);
  });
});

describe('sortByTime', () => {
  it('orders trips by departure time', () => {
    expect(
      sortByTime([
        trip({ id: 'late', departureTime: '16:00' }),
        trip({ id: 'early', departureTime: '07:00' }),
      ]).map((item) => item.id),
    ).toEqual(['early', 'late']);
  });
});

describe('availableChoices', () => {
  it('offers active choices plus the one already saved', () => {
    const choices = [
      { id: 'a', label: 'A', active: true },
      { id: 'b', label: 'B', active: false },
    ];

    expect(availableChoices(choices, '').map((item) => item.id)).toEqual(['a']);
    expect(availableChoices(choices, 'b').map((item) => item.id)).toEqual([
      'a',
      'b',
    ]);
  });
});
