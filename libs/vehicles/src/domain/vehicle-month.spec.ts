import {
  byCategory,
  daysSoFar,
  expenseSum,
  isMonth,
  monthDays,
  shiftMonth,
  VehicleTrip,
  vehicleTotals,
} from './vehicle-month';

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
  price: 5000,
};

describe('vehicle month', () => {
  it('knows the days of a month, leap years included', () => {
    expect(monthDays('2028-02')).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
    expect(monthDays('2026-12')).toEqual({
      from: '2026-12-01',
      to: '2026-12-31',
    });
    expect(isMonth('2026-13')).toBe(false);
  });

  it('moves between months across a year', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('stops the days so far at today, and has none before the month starts', () => {
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

  it('counts only done trips, with their revenue and the ones without a price', () => {
    const totals = vehicleTotals([
      trip,
      { ...trip, id: 'trip-2', direction: 'return', extra: true, price: null },
      {
        ...trip,
        id: 'trip-3',
        status: 'cancelled',
        reason: 'vehicleBreakdown',
      },
      { ...trip, id: 'trip-4', status: 'planned' },
      { ...trip, id: 'trip-5', status: 'unrecorded' },
    ]);

    expect(totals).toEqual({
      done: { outbound: 1, return: 1 },
      extra: 1,
      revenue: 5000,
      unpriced: 1,
    });
  });

  it('adds up expenses by category in the order of the categories', () => {
    const expenses = byCategory([
      { category: 'maintenance', total: 300 },
      { category: 'fuel', total: 1000 },
      { category: 'fuel', total: 500 },
    ]);

    expect(expenses).toEqual([
      { category: 'fuel', total: 1500 },
      { category: 'maintenance', total: 300 },
    ]);
    expect(expenseSum(expenses)).toBe(1800);
  });
});
