import {
  daysSoFar,
  DriverTrip,
  driverTotals,
  driverTripState,
  isMonth,
  monthDays,
  shiftMonth,
} from './driver-month';

const trip: DriverTrip = {
  id: 'trip-1',
  serviceDate: '2026-02-01',
  departureTime: '07:00',
  direction: 'outbound',
  customerId: 'customer-1',
  routeId: 'route-1',
  vehicleId: 'vehicle-1',
  driverId: 'ahmed',
  plannedDriverId: 'ahmed',
  extra: false,
  status: 'done',
  reason: '',
  notes: '',
  price: 5000,
};

describe('driverTripState', () => {
  it('keeps the status of a trip the driver drove', () => {
    expect(driverTripState(trip, 'ahmed')).toBe('done');
    expect(driverTripState({ ...trip, status: 'planned' }, 'ahmed')).toBe(
      'planned',
    );
  });

  it('shows a trip cancelled because the driver was absent as an absence', () => {
    const cancelled = {
      ...trip,
      status: 'cancelled' as const,
      reason: 'driverAbsent' as const,
    };

    expect(driverTripState(cancelled, 'ahmed')).toBe('absent');
    expect(driverTripState({ ...cancelled, reason: 'holiday' }, 'ahmed')).toBe(
      'cancelled',
    );
  });

  it('tells apart a trip another driver took for the absence and for another reason', () => {
    const handed = { ...trip, driverId: 'karim' };

    expect(
      driverTripState({ ...handed, reason: 'driverAbsent' }, 'ahmed'),
    ).toBe('absent');
    expect(
      driverTripState({ ...handed, reason: 'vehicleBreakdown' }, 'ahmed'),
    ).toBe('handedOver');
  });
});

describe('driverTotals', () => {
  it('counts only the done trips the driver drove, with their revenue', () => {
    const totals = driverTotals(
      [
        trip,
        { ...trip, id: 'trip-2', direction: 'return', price: null },
        { ...trip, id: 'trip-3', extra: true, price: 7000 },
        { ...trip, id: 'trip-4', status: 'unrecorded' },
        { ...trip, id: 'trip-5', driverId: 'karim', reason: 'driverAbsent' },
      ],
      'ahmed',
      '2026-02-28',
    );

    expect(totals).toEqual({
      done: { outbound: 2, return: 1 },
      extra: 1,
      absent: { outbound: 1, return: 0 },
      revenue: 12000,
      unpriced: 1,
    });
  });

  it('counts an absence the way the pay does: a planned route trip whose day has come', () => {
    const absent = {
      ...trip,
      status: 'cancelled' as const,
      reason: 'driverAbsent' as const,
    };

    const totals = driverTotals(
      [
        absent,
        { ...absent, id: 'later', serviceDate: '2026-03-01' },
        { ...absent, id: 'extra', extra: true },
        {
          ...absent,
          id: 'other-driver',
          plannedDriverId: 'karim',
          driverId: 'karim',
        },
      ],
      'ahmed',
      '2026-02-28',
    );

    expect(totals.absent).toEqual({ outbound: 1, return: 0 });
  });
});

describe('months', () => {
  it('knows the days of a month, and those up to today', () => {
    expect(monthDays('2028-02')).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
    expect(daysSoFar('2026-02', '2026-02-10')).toEqual({
      from: '2026-02-01',
      to: '2026-02-10',
    });
    expect(daysSoFar('2026-01', '2026-02-10')).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(daysSoFar('2026-03', '2026-02-10')).toBeNull();
  });

  it('moves across years and accepts only a real month', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(isMonth('2026-12')).toBe(true);
    expect(isMonth('2026-13')).toBe(false);
  });
});
