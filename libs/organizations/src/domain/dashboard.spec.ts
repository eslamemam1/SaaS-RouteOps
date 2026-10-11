import {
  dashboard,
  DashboardFacts,
  isSetUp,
  monthDays,
  needsAttention,
  previousMonthDays,
} from './dashboard';

const quiet: DashboardFacts = {
  todayTrips: [],
  todayDone: 0,
  monthDone: 0,
  monthRevenue: 0,
  monthUnpriced: 0,
  monthExpenses: 0,
  unopenedDays: [],
  unrecordedDriverPay: 0,
  unrecordedVehiclePay: 0,
  setup: { customers: 1, drivers: 1, routes: 1 },
};

describe('dashboard', () => {
  it('covers the whole month of today', () => {
    expect(monthDays('2026-10-08')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthDays('2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('checks pay for the month before, across a new year', () => {
    expect(previousMonthDays('2026-10-08')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(previousMonthDays('2027-01-15')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(dashboard(quiet, '2027-01-15').payMonth).toBe('2026-12');
  });

  it('counts a company as set up once it has a route', () => {
    expect(isSetUp({ customers: 1, drivers: 1, routes: 0 })).toBe(false);
    expect(isSetUp({ customers: 1, drivers: 1, routes: 1 })).toBe(true);
  });

  it('counts today’s trips apart from the cancelled ones', () => {
    const summary = dashboard(
      {
        ...quiet,
        todayTrips: [{ cancelled: false }, { cancelled: true }, { cancelled: false }],
        todayDone: 1,
      },
      '2026-10-08',
    );

    expect(summary.today).toEqual({ status: 'open', planned: 2, done: 1, cancelled: 1 });
  });

  it('tells an unopened working day from a day with no routes', () => {
    expect(dashboard({ ...quiet, unopenedDays: ['2026-10-08'] }, '2026-10-08').today.status).toBe(
      'unopened',
    );
    expect(dashboard(quiet, '2026-10-08').today.status).toBe('none');
  });

  it('shows the month’s profit as revenue less expenses, even below zero', () => {
    const summary = dashboard(
      { ...quiet, monthDone: 40, monthRevenue: 500_000, monthExpenses: 650_000 },
      '2026-10-08',
    );

    expect(summary.month).toEqual({
      done: 40,
      revenue: 500_000,
      expenses: 650_000,
      profit: -150_000,
    });
  });

  it('asks for attention to past unopened days, unrecorded pay, and unpriced trips', () => {
    const summary = dashboard(
      {
        ...quiet,
        unopenedDays: ['2026-10-04', '2026-10-06', '2026-10-08'],
        unrecordedDriverPay: 2,
        unrecordedVehiclePay: 1,
        monthUnpriced: 3,
      },
      '2026-10-08',
    );

    expect(summary.attention).toEqual({
      unopenedDays: 2,
      driverPay: 2,
      vehiclePay: 1,
      unpriced: 3,
    });
    expect(summary.firstUnopenedDay).toBe('2026-10-04');
    expect(needsAttention(summary)).toBe(true);
    expect(needsAttention(dashboard(quiet, '2026-10-08'))).toBe(false);
  });
});
