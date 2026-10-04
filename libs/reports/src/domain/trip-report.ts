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

export interface ReportChoices {
  readonly customers: readonly ReportChoice[];
  readonly vehicles: readonly ReportVehicle[];
  readonly drivers: readonly ReportChoice[];
}

// Done trips of one customer, vehicle, and driver. An id is empty when the
// trips had no vehicle or no driver.
export interface TripCount {
  readonly customerId: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly done: number;
  readonly extra: number;
}

// unopenedDays are working days nobody opened on the daily screen, so their
// trips were never recorded and are missing from the counts.
export interface MonthReport {
  readonly counts: readonly TripCount[];
  readonly unopenedDays: readonly string[];
}

export const reportGroups = ['customer', 'vehicle', 'driver'] as const;

export type ReportGroup = (typeof reportGroups)[number];

export interface ReportLine {
  readonly id: string;
  readonly label: string;
  readonly done: number;
  readonly extra: number;
}

export interface ReportTotal {
  readonly done: number;
  readonly extra: number;
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

export function reportLines(
  counts: readonly TripCount[],
  group: ReportGroup,
  choices: ReportChoices,
): ReportLine[] {
  const totals = new Map<string, { done: number; extra: number }>();
  for (const count of counts) {
    const id = groupId(count, group);
    const total = totals.get(id) ?? { done: 0, extra: 0 };
    totals.set(id, {
      done: total.done + count.done,
      extra: total.extra + count.extra,
    });
  }
  const names = groupChoices(group, choices);
  return [...totals]
    .map(([id, total]) => ({
      id,
      label: names.find((choice) => choice.id === id)?.label ?? '',
      ...total,
    }))
    .sort(
      (first, second) =>
        second.done - first.done || first.label.localeCompare(second.label),
    );
}

export function reportTotal(counts: readonly TripCount[]): ReportTotal {
  return counts.reduce(
    (total, count) => ({
      done: total.done + count.done,
      extra: total.extra + count.extra,
    }),
    { done: 0, extra: 0 },
  );
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
    case 'vehicle':
      return choices.vehicles;
    case 'driver':
      return choices.drivers;
  }
}
