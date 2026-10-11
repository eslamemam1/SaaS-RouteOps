export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// Amounts are in the smallest unit of the organization currency. Done trips
// follow the done rule of trip_report, so they match the reports screen.
// Trips are counted as full trips: halves is 1 for one direction of an
// outbound-and-return route and 2 for any other trip.
export interface DashboardTrip {
  readonly cancelled: boolean;
  readonly halves: number;
}

export interface DashboardFacts {
  readonly todayTrips: readonly DashboardTrip[];
  readonly todayDone: number;
  readonly monthDone: number;
  readonly monthRevenue: number;
  readonly monthUnpriced: number;
  readonly monthExpenses: number;
  readonly unopenedDays: readonly string[];
  // Pay still due for the month before, under the same rule as the expenses
  // screen: a month's pay is due once the month is over.
  readonly unrecordedDriverPay: number;
  readonly unrecordedVehiclePay: number;
  // How many of each the company has added, to guide a new company.
  readonly setup: SetupCounts;
}

export interface SetupCounts {
  readonly customers: number;
  readonly drivers: number;
  readonly routes: number;
}

// unopened: today is a working day nobody opened yet, so its trips do not
// exist. none: no route runs today.
export type TodayStatus = 'unopened' | 'none' | 'open';

export interface Dashboard {
  readonly today: {
    readonly status: TodayStatus;
    readonly planned: number;
    readonly done: number;
    readonly cancelled: number;
  };
  readonly month: {
    readonly done: number;
    readonly revenue: number;
    readonly expenses: number;
    readonly profit: number;
  };
  readonly attention: {
    readonly unopenedDays: number;
    readonly driverPay: number;
    readonly vehiclePay: number;
    readonly unpriced: number;
  };
  // The first past day nobody opened, to open it straight away.
  readonly firstUnopenedDay: string | null;
  // The month the pay counts are about, as YYYY-MM.
  readonly payMonth: string;
  readonly setup: SetupCounts;
}

export function monthDays(today: string): DateRange {
  const [year, month] = today.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = today.slice(0, 7);
  return { from: `${prefix}-01`, to: `${prefix}-${String(last).padStart(2, '0')}` };
}

export function previousMonthDays(today: string): DateRange {
  const [year, month] = today.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 2, 1));
  return monthDays(first.toISOString().slice(0, 10));
}

// A company is set up once it has a route, which needs a customer and a
// driver first.
export function isSetUp(setup: SetupCounts): boolean {
  return setup.routes > 0;
}

export function dashboard(facts: DashboardFacts, today: string): Dashboard {
  const cancelled = fullTrips(facts.todayTrips.filter((trip) => trip.cancelled));
  const pastUnopened = facts.unopenedDays.filter((day) => day < today);
  return {
    today: {
      status: todayStatus(facts, today),
      planned: fullTrips(facts.todayTrips) - cancelled,
      done: facts.todayDone,
      cancelled,
    },
    month: {
      done: facts.monthDone,
      revenue: facts.monthRevenue,
      expenses: facts.monthExpenses,
      profit: facts.monthRevenue - facts.monthExpenses,
    },
    attention: {
      unopenedDays: pastUnopened.length,
      driverPay: facts.unrecordedDriverPay,
      vehiclePay: facts.unrecordedVehiclePay,
      unpriced: facts.monthUnpriced,
    },
    firstUnopenedDay: pastUnopened[0] ?? null,
    payMonth: previousMonthDays(today).from.slice(0, 7),
    setup: facts.setup,
  };
}

export function needsAttention(summary: Dashboard): boolean {
  return Object.values(summary.attention).some((count) => count > 0);
}

function fullTrips(trips: readonly DashboardTrip[]): number {
  return trips.reduce((halves, trip) => halves + trip.halves, 0) / 2;
}

function todayStatus(facts: DashboardFacts, today: string): TodayStatus {
  if (facts.todayTrips.length > 0) {
    return 'open';
  }
  return facts.unopenedDays.includes(today) ? 'unopened' : 'none';
}
