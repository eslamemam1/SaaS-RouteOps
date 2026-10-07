export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// Amounts are in the smallest unit of the organization currency. Done trips
// follow the done rule of trip_report, so they match the reports screen.
export interface DashboardFacts {
  readonly todayTrips: readonly { readonly cancelled: boolean }[];
  readonly todayDone: number;
  readonly monthDone: number;
  readonly monthRevenue: number;
  readonly monthUnpriced: number;
  readonly monthExpenses: number;
  readonly unopenedDays: readonly string[];
  readonly unrecordedDriverPay: number;
  readonly unrecordedVehiclePay: number;
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
}

export function monthDays(today: string): DateRange {
  const [year, month] = today.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = today.slice(0, 7);
  return { from: `${prefix}-01`, to: `${prefix}-${String(last).padStart(2, '0')}` };
}

export function dashboard(facts: DashboardFacts, today: string): Dashboard {
  const cancelled = facts.todayTrips.filter((trip) => trip.cancelled).length;
  return {
    today: {
      status: todayStatus(facts, today),
      planned: facts.todayTrips.length - cancelled,
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
      unopenedDays: facts.unopenedDays.filter((day) => day < today).length,
      driverPay: facts.unrecordedDriverPay,
      vehiclePay: facts.unrecordedVehiclePay,
      unpriced: facts.monthUnpriced,
    },
  };
}

export function needsAttention(summary: Dashboard): boolean {
  return Object.values(summary.attention).some((count) => count > 0);
}

function todayStatus(facts: DashboardFacts, today: string): TodayStatus {
  if (facts.todayTrips.length > 0) {
    return 'open';
  }
  return facts.unopenedDays.includes(today) ? 'unopened' : 'none';
}
