import { VehiclePay } from '@routeops/shared/pay';

export const tripDirections = ['outbound', 'return'] as const;

export type TripDirection = (typeof tripDirections)[number];

export type PerDirection = Readonly<Record<TripDirection, number>>;

// How trip_log says a trip counts: 'done' exactly when the reports count it.
export const tripStatuses = [
  'done',
  'unrecorded',
  'planned',
  'cancelled',
] as const;

export type TripStatus = (typeof tripStatuses)[number];

export const changeReasons = [
  'holiday',
  'vehicleBreakdown',
  'driverAbsent',
  'customerRequest',
  'other',
] as const;

export type ChangeReason = (typeof changeReasons)[number];

export const expenseCategories = [
  'fuel',
  'maintenance',
  'salaries',
  'rent',
  'contractors',
  'licenses',
  'tolls',
  'office',
  'other',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

// A trip of the month the vehicle made or was planned to make. An id is empty
// when the trip names none; price is null when neither the trip nor its route
// has one. halves is how many halves of a full trip it is: 1 for one direction
// of an outbound-and-return route, 2 for any other trip.
export interface VehicleTrip {
  readonly id: string;
  readonly serviceDate: string;
  readonly departureTime: string;
  readonly direction: TripDirection;
  readonly customerId: string;
  readonly routeId: string;
  readonly driverId: string;
  readonly extra: boolean;
  readonly status: TripStatus;
  readonly reason: ChangeReason | '';
  readonly notes: string;
  readonly price: number | null;
  readonly halves: number;
}

export interface WorkChoice {
  readonly id: string;
  readonly label: string;
}

// Names for the ids a trip or route holds. Inactive records stay, because past
// trips may still use them.
export interface WorkChoices {
  readonly customers: readonly WorkChoice[];
  readonly routes: readonly WorkChoice[];
  readonly drivers: readonly WorkChoice[];
}

// An active route the vehicle runs now. Times are HH:MM, or empty for a
// direction the route does not run.
export interface VehicleRoute {
  readonly id: string;
  readonly name: string;
  readonly customerId: string;
  readonly driverId: string;
  readonly outboundTime: string;
  readonly returnTime: string;
}

// The month's expenses naming the vehicle, in the smallest currency unit.
export interface CategoryTotal {
  readonly category: ExpenseCategory;
  readonly total: number;
}

// rent is null for a vehicle without rent terms, such as one the company
// owns. unopenedDays are working days nobody opened, so their trips are
// missing.
export interface VehicleMonth {
  readonly trips: readonly VehicleTrip[];
  readonly rent: VehiclePay | null;
  readonly expenses: readonly CategoryTotal[];
  readonly unopenedDays: readonly string[];
}

// done counts each direction, as per-trip rent does; full and extraFull count
// full trips.
export interface VehicleMonthTotals {
  readonly done: PerDirection;
  readonly extra: number;
  readonly full: number;
  readonly extraFull: number;
  readonly revenue: number;
  readonly unpriced: number;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonth(value: string): boolean {
  return monthPattern.test(value);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function monthDays(month: string): DateRange {
  const [year, index] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, '0')}`,
  };
}

// The days of the month up to today, or null when the month has not started.
export function daysSoFar(month: string, today: string): DateRange | null {
  const { from, to } = monthDays(month);
  if (from > today) {
    return null;
  }
  return { from, to: to < today ? to : today };
}

export function isTripStatus(value: string): value is TripStatus {
  return (tripStatuses as readonly string[]).includes(value);
}

export function isTripDirection(value: string): value is TripDirection {
  return (tripDirections as readonly string[]).includes(value);
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (expenseCategories as readonly string[]).includes(value);
}

// Done trips at each trip's price, as the reports count the vehicle's line.
export function vehicleTotals(
  trips: readonly VehicleTrip[],
): VehicleMonthTotals {
  const done = { outbound: 0, return: 0 };
  let extra = 0;
  let halves = 0;
  let extraHalves = 0;
  let revenue = 0;
  let unpriced = 0;
  for (const trip of trips) {
    if (trip.status !== 'done') {
      continue;
    }
    done[trip.direction] += 1;
    halves += trip.halves;
    if (trip.extra) {
      extra += 1;
      extraHalves += trip.halves;
    }
    if (trip.price === null) {
      unpriced += 1;
    } else {
      revenue += trip.price;
    }
  }
  return {
    done,
    extra,
    full: halves / 2,
    extraFull: extraHalves / 2,
    revenue,
    unpriced,
  };
}

// Adds up expense rows by category, in the order of the categories.
export function byCategory(
  rows: readonly {
    readonly category: ExpenseCategory;
    readonly total: number;
  }[],
): CategoryTotal[] {
  return expenseCategories.flatMap((category) => {
    const total = rows
      .filter((row) => row.category === category)
      .reduce((sum, row) => sum + row.total, 0);
    return total > 0 ? [{ category, total }] : [];
  });
}

export function expenseSum(expenses: readonly CategoryTotal[]): number {
  return expenses.reduce((sum, expense) => sum + expense.total, 0);
}

export function choiceLabel(
  choices: readonly WorkChoice[],
  id: string,
): string {
  return choices.find((choice) => choice.id === id)?.label ?? '';
}
