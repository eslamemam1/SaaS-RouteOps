import { Currency } from '@routeops/shared/money';

export const reportProblems = [
  'signedOut',
  'organization',
  'load',
  'notConnected',
] as const;

export type ReportProblem = (typeof reportProblems)[number];

export interface ReportOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

export const vehicleOwnerships = ['owned', 'rented', 'contractor'] as const;

export type VehicleOwnership = (typeof vehicleOwnerships)[number];

export interface ReportChoice {
  readonly id: string;
  readonly label: string;
}

export interface ReportVehicle extends ReportChoice {
  readonly ownership: VehicleOwnership;
  readonly ownerName: string;
}

// The same route name may serve several customers, so a route is shown with
// its customer.
export interface ReportRoute extends ReportChoice {
  readonly customerId: string;
}

export interface ReportChoices {
  readonly customers: readonly ReportChoice[];
  readonly routes: readonly ReportRoute[];
  readonly vehicles: readonly ReportVehicle[];
  readonly drivers: readonly ReportChoice[];
}

// Done trips of one customer, route, vehicle, and driver. An id is empty when
// the trips had no route, no vehicle, or no driver.
// revenue is in the smallest unit of the organization currency; unpriced trips
// had no price of their own and no route price, so revenue leaves them out.
export interface TripCount {
  readonly customerId: string;
  readonly routeId: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly done: number;
  readonly extra: number;
  readonly revenue: number;
  readonly unpriced: number;
}

// Expenses of one category spent on one vehicle and driver, in the smallest
// unit of the organization currency. An id is empty when the expenses name no
// vehicle or no driver.
export interface ExpenseTotal {
  readonly category: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly total: number;
}

// Drivers and vehicles with pay due this month and nothing recorded for them
// yet, so the route shares leave that pay out.
export interface UnrecordedPay {
  readonly drivers: number;
  readonly vehicles: number;
}

// unopenedDays are working days nobody opened on the daily screen, so their
// trips were never recorded and are missing from the counts.
export interface MonthReport {
  readonly counts: readonly TripCount[];
  readonly expenses: readonly ExpenseTotal[];
  readonly unopenedDays: readonly string[];
  readonly unrecorded: UnrecordedPay;
}

export const reportGroups = ['customer', 'route', 'vehicle', 'driver'] as const;

export type ReportGroup = (typeof reportGroups)[number];

// expenses are counted only for vehicle lines, and driverCost and vehicleCost
// only for route lines; other lines have 0.
export interface ReportLine {
  readonly id: string;
  readonly label: string;
  readonly done: number;
  readonly extra: number;
  readonly revenue: number;
  readonly unpriced: number;
  readonly expenses: number;
  readonly driverCost: number;
  readonly vehicleCost: number;
}

export interface RouteCosts {
  readonly driver: number;
  readonly vehicle: number;
}

// What each route carries of the recorded driver and vehicle expenses, and
// other: the expenses no route carries, such as office costs or the costs of
// a driver or vehicle with no done trips this month.
export interface CostShares {
  readonly routes: ReadonlyMap<string, RouteCosts>;
  readonly other: number;
}

export interface ReportTotal {
  readonly done: number;
  readonly extra: number;
  readonly revenue: number;
  readonly unpriced: number;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isVehicleOwnership(value: string): value is VehicleOwnership {
  return (vehicleOwnerships as readonly string[]).includes(value);
}

export function isReportMonth(value: string): boolean {
  return monthPattern.test(value);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, months: number): string {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, index - 1 + months, 1));
  return date.toISOString().slice(0, 7);
}

export function monthDays(month: string): DateRange {
  const [year, index] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

// The days of the month up to today, or null when the month has not started.
export function daysSoFar(month: string, today: string): DateRange | null {
  const { from, to } = monthDays(month);
  if (from > today) {
    return null;
  }
  return { from, to: to < today ? to : today };
}

// A vehicle with expenses but no done trips still gets a line, so its cost
// shows.
export function reportLines(
  counts: readonly TripCount[],
  group: ReportGroup,
  choices: ReportChoices,
  expenses: readonly ExpenseTotal[] = [],
): ReportLine[] {
  const totals = new Map<string, ReportTotal>();
  for (const count of counts) {
    const id = groupId(count, group);
    totals.set(id, addCount(totals.get(id) ?? emptyTotal, count));
  }
  const spent = new Map<string, number>();
  if (group === 'vehicle') {
    for (const expense of expenses) {
      spent.set(expense.vehicleId, (spent.get(expense.vehicleId) ?? 0) + expense.total);
      totals.set(expense.vehicleId, totals.get(expense.vehicleId) ?? emptyTotal);
    }
  }
  const shares = group === 'route' ? costShares(counts, expenses).routes : null;
  const names = groupChoices(group, choices);
  return [...totals]
    .map(([id, total]) => ({
      id,
      label: names.find((choice) => choice.id === id)?.label ?? '',
      ...total,
      expenses: spent.get(id) ?? 0,
      driverCost: shares?.get(id)?.driver ?? 0,
      vehicleCost: shares?.get(id)?.vehicle ?? 0,
    }))
    .sort(
      (first, second) =>
        second.done - first.done || first.label.localeCompare(second.label),
    );
}

// An expense naming a driver is the driver's when it is a salary or names no
// vehicle; any other expense naming a vehicle is the vehicle's. Each driver's
// and vehicle's expenses are shared over the routes by the done trips made on
// each, so a driver or vehicle working one route puts all of it on that route.
// Trips that name no route share theirs on the line with an empty id.
export function costShares(
  counts: readonly TripCount[],
  expenses: readonly ExpenseTotal[],
): CostShares {
  const driverCosts = new Map<string, number>();
  const vehicleCosts = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.driverId && (expense.category === 'salaries' || !expense.vehicleId)) {
      add(driverCosts, expense.driverId, expense.total);
    } else if (expense.vehicleId) {
      add(vehicleCosts, expense.vehicleId, expense.total);
    }
  }
  const driverTrips = new Map<string, number>();
  const vehicleTrips = new Map<string, number>();
  for (const count of counts) {
    if (count.driverId) {
      add(driverTrips, count.driverId, count.done);
    }
    if (count.vehicleId) {
      add(vehicleTrips, count.vehicleId, count.done);
    }
  }
  const driverShares = new Map<string, number>();
  const vehicleShares = new Map<string, number>();
  for (const count of counts) {
    const driverCost = driverCosts.get(count.driverId);
    if (driverCost) {
      add(driverShares, count.routeId, (driverCost * count.done) / (driverTrips.get(count.driverId) ?? count.done));
    }
    const vehicleCost = vehicleCosts.get(count.vehicleId);
    if (vehicleCost) {
      add(vehicleShares, count.routeId, (vehicleCost * count.done) / (vehicleTrips.get(count.vehicleId) ?? count.done));
    }
  }
  const routes = new Map<string, RouteCosts>();
  let carried = 0;
  for (const id of new Set([...driverShares.keys(), ...vehicleShares.keys()])) {
    const costs = {
      driver: Math.round(driverShares.get(id) ?? 0),
      vehicle: Math.round(vehicleShares.get(id) ?? 0),
    };
    routes.set(id, costs);
    carried += costs.driver + costs.vehicle;
  }
  return { routes, other: expenseSum(expenses) - carried };
}

function add(totals: Map<string, number>, id: string, amount: number): void {
  totals.set(id, (totals.get(id) ?? 0) + amount);
}

export function reportTotal(counts: readonly TripCount[]): ReportTotal {
  return counts.reduce(addCount, emptyTotal);
}

export function expenseSum(expenses: readonly ExpenseTotal[]): number {
  return expenses.reduce((total, expense) => total + expense.total, 0);
}

const emptyTotal: ReportTotal = { done: 0, extra: 0, revenue: 0, unpriced: 0 };

function addCount(total: ReportTotal, count: TripCount): ReportTotal {
  return {
    done: total.done + count.done,
    extra: total.extra + count.extra,
    revenue: total.revenue + count.revenue,
    unpriced: total.unpriced + count.unpriced,
  };
}

export function memberOrganization(
  memberships: readonly ReportOrganization[],
  requestedId: string,
): ReportOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}

function groupId(count: TripCount, group: ReportGroup): string {
  switch (group) {
    case 'customer':
      return count.customerId;
    case 'route':
      return count.routeId;
    case 'vehicle':
      return count.vehicleId;
    case 'driver':
      return count.driverId;
  }
}

function groupChoices(
  group: ReportGroup,
  choices: ReportChoices,
): readonly ReportChoice[] {
  switch (group) {
    case 'customer':
      return choices.customers;
    case 'route':
      return choices.routes;
    case 'vehicle':
      return choices.vehicles;
    case 'driver':
      return choices.drivers;
  }
}
