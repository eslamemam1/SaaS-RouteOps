export interface OperationsOrganization {
  readonly id: string;
  readonly name: string;
}

// A customer, vehicle, driver, or route a trip can point to.
export interface OperationChoice {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

export interface OperationChoices {
  readonly customers: readonly OperationChoice[];
  readonly vehicles: readonly OperationChoice[];
  readonly drivers: readonly OperationChoice[];
  readonly routes: readonly OperationChoice[];
}

export const tripDirections = ['outbound', 'return'] as const;

export type TripDirection = (typeof tripDirections)[number];

export const changeReasons = [
  'holiday',
  'vehicleBreakdown',
  'driverAbsent',
  'customerRequest',
  'other',
] as const;

export type ChangeReason = (typeof changeReasons)[number];

export interface TripChange {
  readonly vehicleId: string;
  readonly driverId: string;
  readonly cancelled: boolean;
  readonly reason: ChangeReason | '';
  readonly notes: string;
}

export interface DailyTrip extends TripChange {
  readonly id: string;
  readonly routeId: string;
  readonly serviceDate: string;
  readonly direction: TripDirection;
  readonly departureTime: string;
  readonly customerId: string;
}

export type TripStatus = 'done' | 'planned' | 'cancelled';

export const tripLimits = {
  notes: 2000,
} as const;

export const operationsProblems = [
  'reason',
  'otherNotes',
  'tooLong',
  'date',
  'customers',
  'load',
  'save',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type OperationsProblem = (typeof operationsProblems)[number];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isChangeReason(value: string): value is ChangeReason {
  return (changeReasons as readonly string[]).includes(value);
}

export function isServiceDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// A trip counts as done unless it is cancelled, once its day has come.
export function tripStatus(trip: DailyTrip, today: string): TripStatus {
  if (trip.cancelled) {
    return 'cancelled';
  }
  return trip.serviceDate <= today ? 'done' : 'planned';
}

export function changeOf(trip: DailyTrip): TripChange {
  return {
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    cancelled: trip.cancelled,
    reason: trip.reason,
    notes: trip.notes,
  };
}

export function reasonError(reason: string): OperationsProblem | null {
  return isChangeReason(reason) ? null : 'reason';
}

export function notesError(
  notes: string,
  reason: string,
): OperationsProblem | null {
  const text = notes.trim();
  if (text.length > tripLimits.notes) {
    return 'tooLong';
  }
  return reason === 'other' && text.length === 0 ? 'otherNotes' : null;
}

export function sortByTime(trips: readonly DailyTrip[]): DailyTrip[] {
  return [...trips].sort(
    (first, second) =>
      first.departureTime.localeCompare(second.departureTime) ||
      first.direction.localeCompare(second.direction),
  );
}

// Customers that still have trips running on the day, for the holiday list.
export function customersWithRunningTrips(trips: readonly DailyTrip[]): string[] {
  return [
    ...new Set(
      trips.filter((trip) => !trip.cancelled).map((trip) => trip.customerId),
    ),
  ];
}

// Keeps choices the user may pick now, plus the one already saved.
export function availableChoices(
  choices: readonly OperationChoice[],
  selectedId: string,
): OperationChoice[] {
  return choices.filter((choice) => choice.active || choice.id === selectedId);
}

export function choiceLabel(
  choices: readonly OperationChoice[],
  id: string,
): string {
  return choices.find((choice) => choice.id === id)?.label ?? '';
}

export function memberOrganization(
  memberships: readonly OperationsOrganization[],
  requestedId: string,
): OperationsOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}
