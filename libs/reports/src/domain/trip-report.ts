import { Currency } from '@routeops/shared/money';

export const reportProblems = [
  'signedOut',
  'organization',
  'load',
  'notConnected',
  'date',
  'tooManyDays',
] as const;

export type ReportProblem = (typeof reportProblems)[number];

export interface ReportOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

export const vehicleOwnerships = ['owned', 'rented', 'contractor'] as const;

export type VehicleOwnership = (typeof vehicleOwnerships)[number];

export const vehicleTypes = ['bus', 'minibus', 'microbus', 'car'] as const;

export type VehicleType = (typeof vehicleTypes)[number];

export interface ReportChoice {
  readonly id: string;
  readonly label: string;
}

export interface ReportVehicle extends ReportChoice {
  readonly ownership: VehicleOwnership;
  readonly ownerName: string;
  readonly type: VehicleType;
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
// done and extra count each direction; full and extraFull count full trips,
// where one direction of an outbound-and-return route is half of one.
// revenue is in the smallest unit of the organization currency; unpriced trips
// had no price of their own and no route price, so revenue leaves them out.
export interface TripCount {
  readonly customerId: string;
  readonly routeId: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly done: number;
  readonly extra: number;
  readonly full: number;
  readonly extraFull: number;
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
  readonly full: number;
  readonly extraFull: number;
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
  readonly full: number;
  readonly extraFull: number;
  readonly revenue: number;
  readonly unpriced: number;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// One line on a contracting-company invoice: a route's done trips, or the
// extra trips that named no route.
export interface InvoiceLine {
  readonly routeId: string;
  readonly label: string;
  readonly vehicleType: VehicleType | '';
  readonly trips: number;
  readonly extra: number;
  readonly rate: number | null;
  readonly revenue: number;
  readonly unpriced: number;
}

export const maximumInvoiceDays = 93;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export function isVehicleOwnership(value: string): value is VehicleOwnership {
  return (vehicleOwnerships as readonly string[]).includes(value);
}

export function isVehicleType(value: string): value is VehicleType {
  return (vehicleTypes as readonly string[]).includes(value);
}

export function isReportMonth(value: string): boolean {
  return monthPattern.test(value);
}

export function isReportDay(value: string): boolean {
  if (!dayPattern.test(value)) {
    return false;
  }
  const day = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
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

export function dayCount(from: string, to: string): number {
  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  return days + 1;
}

// Invoice days may reach today; future days never belong on a bill.
export function invoiceDateError(
  days: DateRange,
  today: string,
): ReportProblem | null {
  if (!isReportDay(days.from) || !isReportDay(days.to)) {
    return 'date';
  }
  if (days.from > days.to || days.to > today) {
    return 'date';
  }
  return dayCount(days.from, days.to) > maximumInvoiceDays ? 'tooManyDays' : null;
}

// From the first of the current month through today.
export function invoiceDaysSoFar(today: string): DateRange {
  return { from: `${monthOf(today)}-01`, to: today };
}

export function previousMonthDays(today: string): DateRange {
  const [year, month] = monthOf(today).split('-').map(Number);
  const previous =
    month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, '0')}`;
  return monthDays(previous);
}

// Exact price of one full trip when every full trip shared the same amount.
export function invoiceRate(revenue: number, full: number): number | null {
  if (full <= 0 || revenue <= 0) {
    return null;
  }
  const halves = full * 2;
  if (!Number.isInteger(halves) || revenue % halves !== 0) {
    return null;
  }
  return (revenue / halves) * 2;
}

// Lines for one contracting company: one row per route, and one for extras
// with no route. Mixed vehicle types on a route keep the type with most trips.
export function customerInvoiceLines(
  counts: readonly TripCount[],
  customerId: string,
  choices: ReportChoices,
): InvoiceLine[] {
  const ofCustomer = counts.filter((count) => count.customerId === customerId);
  const byRoute = new Map<string, TripCount[]>();
  for (const count of ofCustomer) {
    const rows = byRoute.get(count.routeId) ?? [];
    rows.push(count);
    byRoute.set(count.routeId, rows);
  }
  const vehicles = new Map(
    choices.vehicles.map((vehicle) => [vehicle.id, vehicle] as const),
  );
  const routes = new Map(
    choices.routes.map((route) => [route.id, route] as const),
  );
  return [...byRoute]
    .map(([routeId, rows]) => {
      const total = rows.reduce(addCount, emptyTotal);
      return {
        routeId,
        label: routes.get(routeId)?.label ?? '',
        vehicleType: leadingVehicleType(rows, vehicles),
        trips: total.full,
        extra: total.extraFull,
        rate: invoiceRate(total.revenue, total.full),
        revenue: total.revenue,
        unpriced: total.unpriced,
      };
    })
    .sort(
      (first, second) =>
        first.label.localeCompare(second.label) ||
        first.routeId.localeCompare(second.routeId),
    );
}

function leadingVehicleType(
  rows: readonly TripCount[],
  vehicles: ReadonlyMap<string, ReportVehicle>,
): VehicleType | '' {
  const doneByType = new Map<VehicleType | '', number>();
  for (const row of rows) {
    const type = vehicles.get(row.vehicleId)?.type ?? '';
    doneByType.set(type, (doneByType.get(type) ?? 0) + row.done);
  }
  let best: VehicleType | '' = '';
  let bestDone = -1;
  for (const [type, done] of doneByType) {
    if (done > bestDone || (done === bestDone && type < best)) {
      best = type;
      bestDone = done;
    }
  }
  return best;
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
  const driverTrips = new Map<string, Map<string, number>>();
  const vehicleTrips = new Map<string, Map<string, number>>();
  for (const count of counts) {
    if (count.driverId) {
      addTrips(driverTrips, count.driverId, count.routeId, count.done);
    }
    if (count.vehicleId) {
      addTrips(vehicleTrips, count.vehicleId, count.routeId, count.done);
    }
  }
  const driverShares = spread(driverCosts, driverTrips);
  const vehicleShares = spread(vehicleCosts, vehicleTrips);
  const routes = new Map<string, RouteCosts>();
  let carried = 0;
  for (const id of new Set([...driverShares.keys(), ...vehicleShares.keys()])) {
    const costs = {
      driver: driverShares.get(id) ?? 0,
      vehicle: vehicleShares.get(id) ?? 0,
    };
    routes.set(id, costs);
    carried += costs.driver + costs.vehicle;
  }
  return { routes, other: expenseSum(expenses) - carried };
}

function addTrips(
  trips: Map<string, Map<string, number>>,
  ownerId: string,
  routeId: string,
  done: number,
): void {
  const routes = trips.get(ownerId) ?? new Map<string, number>();
  add(routes, routeId, done);
  trips.set(ownerId, routes);
}

// Splits each cost over its routes by trips in whole minor units, giving the
// units left by rounding down to the largest remainders, so a cost is carried
// in full and nothing is rounded away.
function spread(
  costs: ReadonlyMap<string, number>,
  trips: ReadonlyMap<string, ReadonlyMap<string, number>>,
): Map<string, number> {
  const shares = new Map<string, number>();
  for (const [ownerId, cost] of costs) {
    const routes = [...(trips.get(ownerId) ?? [])].filter(([, done]) => done > 0);
    const total = routes.reduce((sum, [, done]) => sum + done, 0);
    if (total === 0) {
      continue;
    }
    const parts = routes.map(([routeId, done]) => ({
      routeId,
      amount: Math.floor((cost * done) / total),
      remainder: (cost * done) % total,
    }));
    let left = cost - parts.reduce((sum, part) => sum + part.amount, 0);
    parts
      .slice()
      .sort(
        (first, second) =>
          second.remainder - first.remainder || first.routeId.localeCompare(second.routeId),
      )
      .forEach((part) => {
        if (left > 0) {
          part.amount += 1;
          left -= 1;
        }
      });
    for (const part of parts) {
      add(shares, part.routeId, part.amount);
    }
  }
  return shares;
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

const emptyTotal: ReportTotal = {
  done: 0,
  extra: 0,
  full: 0,
  extraFull: 0,
  revenue: 0,
  unpriced: 0,
};

function addCount(total: ReportTotal, count: TripCount): ReportTotal {
  return {
    done: total.done + count.done,
    extra: total.extra + count.extra,
    full: total.full + count.full,
    extraFull: total.extraFull + count.extraFull,
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
