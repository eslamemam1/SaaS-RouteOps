import {
  availableChoices,
  canMarkDone,
  conflictsByTrip,
  countByStatus,
  customersOnDay,
  customersWithRunningTrips,
  DailyTrip,
  emptyExtraTrip,
  emptyTripFilter,
  extraTripError,
  filterTrips,
  isServiceDate,
  notesError,
  reasonError,
  shiftDate,
  sortByTime,
  tripConflicts,
  TripFilter,
  TripRecording,
  tripStatus,
  withRoute,
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
  extra: false,
  ...overrides,
});

const noChoices = { customers: [], vehicles: [], drivers: [], routes: [] };

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

describe('filtering a busy day', () => {
  const today = '2026-10-04';
  const choices = {
    customers: [
      { id: 'nour', label: 'Nour Company', active: true },
      { id: 'delta', label: 'Delta Factory', active: true },
      { id: 'misr', label: 'Misr Bank', active: true },
    ],
    vehicles: [
      { id: 'bus-1', label: 'أ ب ج 1234', active: true, ownership: 'rented' as const },
      { id: 'vehicle-1', label: 'د هـ و 5678', active: true, ownership: 'contractor' as const },
    ],
    drivers: [{ id: 'ahmed', label: 'أحمد علي', active: true }],
    routes: [
      { id: 'nasr', label: 'مدينة نصر', active: true, customerId: 'delta', vehicleId: '', driverId: '' },
      { id: 'maadi', label: 'Maadi', active: true, customerId: 'nour', vehicleId: '', driverId: '' },
    ],
  };
  const trips = [
    trip({ id: '1', customerId: 'delta', routeId: 'nasr', vehicleId: 'bus-1', driverId: 'ahmed' }),
    trip({ id: '2', customerId: 'delta', routeId: 'nasr', direction: 'return', vehicleId: '', driverId: '' }),
    trip({ id: '3', customerId: 'nour', routeId: 'maadi', vehicleId: '', driverId: '', done: true }),
    trip({ id: '4', customerId: 'nour', routeId: 'maadi', cancelled: true, reason: 'holiday' }),
  ];
  const ids = (filter: Partial<TripFilter>, recording: TripRecording = 'manual') =>
    filterTrips(trips, { ...emptyTripFilter, ...filter }, choices, today, recording).map(
      (item) => item.id,
    );

  it('shows every trip without a filter', () => {
    expect(ids({})).toEqual(['1', '2', '3', '4']);
  });

  it('narrows by company, direction, and status together', () => {
    expect(ids({ customerId: 'delta' })).toEqual(['1', '2']);
    expect(ids({ customerId: 'delta', direction: 'return' })).toEqual(['2']);
    expect(ids({ status: 'unrecorded' })).toEqual(['1', '2']);
    expect(ids({ status: 'done' })).toEqual(['3']);
    expect(ids({ status: 'done' }, 'automatic')).toEqual(['1', '2', '3']);
  });

  it('searches route, driver, and plate, ignoring spaces and Arabic letter forms', () => {
    expect(ids({ search: 'مدينه نصر' })).toEqual(['1', '2']);
    expect(ids({ search: 'احمد' })).toEqual(['1']);
    expect(ids({ search: 'ابج١٢٣٤' })).toEqual(['1']);
    expect(ids({ search: 'MAADI' })).toEqual(['3', '4']);
    expect(ids({ search: 'Heliopolis' })).toEqual([]);
  });

  it('shows only the trips of rented or contractor vehicles', () => {
    expect(ids({ ownership: 'rented' })).toEqual(['1']);
    expect(ids({ ownership: 'contractor' })).toEqual(['4']);
    expect(ids({ ownership: 'owned' })).toEqual([]);
    expect(ids({ ownership: 'rented', customerId: 'nour' })).toEqual([]);
  });

  it('counts the day trips by status', () => {
    expect(countByStatus(trips, today, 'manual')).toEqual({
      done: 1,
      unrecorded: 2,
      planned: 0,
      cancelled: 1,
    });
  });

  it('offers only companies with trips on the day, plus the chosen one', () => {
    expect(customersOnDay(trips, choices.customers, '').map((item) => item.id)).toEqual([
      'delta',
      'nour',
    ]);
    expect(
      customersOnDay(trips, choices.customers, 'misr').map((item) => item.id),
    ).toEqual(['delta', 'misr', 'nour']);
  });
});

describe('vehicle and driver conflicts', () => {
  const morning = trip({ id: 'morning', departureTime: '07:00', vehicleId: 'bus-1', driverId: 'ahmed' });

  it('warns when the same vehicle leaves again less than an hour later', () => {
    const other = trip({ id: 'other', departureTime: '07:45', vehicleId: 'bus-1', driverId: 'karim' });

    expect(tripConflicts(morning, [morning, other])).toEqual([
      { kind: 'vehicle', trip: other },
    ]);
  });

  it('warns about the same driver and reports both kinds when both repeat', () => {
    const sameDriver = trip({ id: 'driver', departureTime: '06:30', vehicleId: 'bus-2', driverId: 'ahmed' });
    const both = trip({ id: 'both', departureTime: '07:00', vehicleId: 'bus-1', driverId: 'ahmed', extra: true });

    expect(
      tripConflicts(morning, [morning, sameDriver, both]).map(
        (conflict) => `${conflict.trip.id}:${conflict.kind}`,
      ),
    ).toEqual(['driver:driver', 'both:vehicle', 'both:driver']);
  });

  it('allows the same vehicle and driver an hour or more apart', () => {
    const later = trip({ id: 'later', departureTime: '08:00', vehicleId: 'bus-1', driverId: 'ahmed' });

    expect(tripConflicts(morning, [morning, later])).toEqual([]);
  });

  it('ignores cancelled trips and trips without a vehicle or driver', () => {
    const cancelled = trip({ id: 'cancelled', vehicleId: 'bus-1', cancelled: true, reason: 'holiday' });
    const unassigned = trip({ id: 'unassigned', vehicleId: '', driverId: '' });

    expect(tripConflicts(morning, [morning, cancelled])).toEqual([]);
    expect(tripConflicts(unassigned, [unassigned, trip({ id: 'x', vehicleId: '', driverId: '' })])).toEqual([]);
    expect(tripConflicts({ ...morning, cancelled: true }, [morning, trip({ id: 'y' })])).toEqual([]);
  });

  it('checks a trip that is not saved yet, once its time is valid', () => {
    const candidate = { id: '', vehicleId: 'bus-1', driverId: '', departureTime: '07:20', cancelled: false };

    expect(tripConflicts(candidate, [morning]).map((conflict) => conflict.kind)).toEqual(['vehicle']);
    expect(tripConflicts({ ...candidate, departureTime: '' }, [morning])).toEqual([]);
  });

  it('lists the conflicts of every trip of the day and filters by them', () => {
    const other = trip({ id: 'other', departureTime: '07:30', vehicleId: 'bus-1', driverId: 'karim' });
    const free = trip({ id: 'free', departureTime: '07:30', vehicleId: 'bus-2', driverId: 'mona' });
    const day = [morning, other, free];

    expect([...conflictsByTrip(day).keys()]).toEqual(['morning', 'other']);
    expect(
      filterTrips(day, { ...emptyTripFilter, conflictsOnly: true }, noChoices, '2026-10-04', 'automatic').map(
        (item) => item.id,
      ),
    ).toEqual(['morning', 'other']);
  });
});

describe('extra trips', () => {
  const routes = [
    {
      id: 'nasr',
      label: 'Nasr City',
      active: true,
      customerId: 'delta',
      vehicleId: 'bus-1',
      driverId: 'ahmed',
    },
  ];

  it('fills the customer, vehicle, and driver from the chosen route', () => {
    expect(withRoute(emptyExtraTrip, routes, 'nasr')).toEqual({
      ...emptyExtraTrip,
      routeId: 'nasr',
      customerId: 'delta',
      vehicleId: 'bus-1',
      driverId: 'ahmed',
    });
  });

  it('keeps the chosen company when the route is cleared', () => {
    const chosen = withRoute(emptyExtraTrip, routes, 'nasr');

    expect(withRoute(chosen, routes, '')).toEqual({ ...chosen, routeId: '' });
  });

  it('needs a company and a time, but no route, vehicle, or driver', () => {
    expect(extraTripError(emptyExtraTrip)).toBe('customer');
    expect(extraTripError({ ...emptyExtraTrip, customerId: 'delta' })).toBe('time');
    expect(
      extraTripError({ ...emptyExtraTrip, customerId: 'delta', departureTime: '25:00' }),
    ).toBe('time');
    expect(
      extraTripError({ ...emptyExtraTrip, customerId: 'delta', departureTime: '21:30' }),
    ).toBeNull();
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
