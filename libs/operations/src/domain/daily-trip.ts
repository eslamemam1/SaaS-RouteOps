import { amountError, Currency } from '@routeops/shared/money';

export interface OperationsOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

// A customer, vehicle, driver, or route a trip can point to.
export interface OperationChoice {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

// A route with the customer, vehicle, and driver it normally uses.
export interface OperationRoute extends OperationChoice {
  readonly customerId: string;
  readonly vehicleId: string;
  readonly driverId: string;
}

export const vehicleOwnerships = ['owned', 'rented', 'contractor'] as const;

export type VehicleOwnership = (typeof vehicleOwnerships)[number];

export interface OperationVehicle extends OperationChoice {
  readonly ownership: VehicleOwnership;
}

export interface OperationChoices {
  readonly customers: readonly OperationChoice[];
  readonly vehicles: readonly OperationVehicle[];
  readonly drivers: readonly OperationChoice[];
  readonly routes: readonly OperationRoute[];
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
  // Empty for an extra trip that belongs to no route.
  readonly routeId: string;
  readonly serviceDate: string;
  readonly direction: TripDirection;
  readonly departureTime: string;
  // When the trip ends; the driver and vehicle are occupied until then.
  readonly arrivalTime: string;
  readonly customerId: string;
  // A member marked the trip done.
  readonly done: boolean;
  // A member added the trip by hand, on top of the trips of the routes.
  readonly extra: boolean;
}

// A route trip a member deleted from a day; restore puts it back from the route.
export interface TripOmission {
  readonly routeId: string;
  readonly serviceDate: string;
  readonly direction: TripDirection;
}

export interface ExtraTripDetails {
  readonly routeId: string;
  readonly customerId: string;
  readonly direction: TripDirection;
  readonly departureTime: string;
  readonly arrivalTime: string;
  readonly vehicleId: string;
  readonly driverId: string;
  // As the member types it in the organization's currency, such as "150.50".
  // Blank means the trip is counted at its route's price, if it has one.
  readonly tripPrice: string;
  readonly notes: string;
}

export const emptyExtraTrip: ExtraTripDetails = {
  routeId: '',
  customerId: '',
  direction: 'outbound',
  departureTime: '',
  arrivalTime: '',
  vehicleId: '',
  driverId: '',
  tripPrice: '',
  notes: '',
};

// How the organization records its trips: automatically, or a member marks
// each trip done.
export const tripRecordings = ['automatic', 'manual'] as const;

export type TripRecording = (typeof tripRecordings)[number];

// A change of how trips are recorded applies from its day on, so each day
// keeps the way of recording in force on it.
export interface RecordingPeriod {
  readonly startsOn: string;
  readonly recording: TripRecording;
}

export const tripStatuses = [
  'done',
  'unrecorded',
  'planned',
  'cancelled',
] as const;

export type TripStatus = (typeof tripStatuses)[number];

export const tripLimits = {
  notes: 2000,
} as const;

export const operationsProblems = [
  'reason',
  'otherNotes',
  'tooLong',
  'date',
  'customer',
  'driver',
  'time',
  'arrival',
  'tripPrice',
  'customers',
  'routes',
  'pastDays',
  'tooManyDays',
  'noTrip',
  'driverOverlap',
  'vehicleOverlap',
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

export function isTripRecording(value: string): value is TripRecording {
  return (tripRecordings as readonly string[]).includes(value);
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

// Route trips are added only to days that have passed, at most this many at
// once, as the database allows.
export const maximumPastDays = 93;

export interface PastDays {
  readonly from: string;
  readonly to: string;
}

export function dayCount(from: string, to: string): number {
  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  return days + 1;
}

export function pastDaysError(
  days: PastDays,
  today: string,
): OperationsProblem | null {
  if (!isServiceDate(days.from) || !isServiceDate(days.to)) {
    return 'date';
  }
  if (days.from > days.to || days.to >= today) {
    return 'pastDays';
  }
  return dayCount(days.from, days.to) > maximumPastDays ? 'tooManyDays' : null;
}

// From the first of the month to yesterday, or yesterday alone on the first.
export function monthSoFar(today: string): PastDays {
  const to = shiftDate(today, -1);
  return { from: `${to.slice(0, 8)}01`, to };
}

// A past day shown on the page is the one to fill; otherwise the month so far.
export function suggestedPastDays(serviceDate: string, today: string): PastDays {
  return serviceDate < today
    ? { from: serviceDate, to: serviceDate }
    : monthSoFar(today);
}

// A trip marked done counts as done. Otherwise, once its day has come, it
// counts as done when recording is automatic and stays unrecorded when manual.
export function tripStatus(
  trip: DailyTrip,
  today: string,
  recording: TripRecording,
): TripStatus {
  if (trip.cancelled) {
    return 'cancelled';
  }
  if (trip.done) {
    return 'done';
  }
  if (trip.serviceDate > today) {
    return 'planned';
  }
  return recording === 'automatic' ? 'done' : 'unrecorded';
}

// Before any change, an organization records automatically.
export function recordingOn(
  periods: readonly RecordingPeriod[],
  day: string,
): TripRecording {
  let current: RecordingPeriod | null = null;
  for (const period of periods) {
    if (
      period.startsOn <= day &&
      (!current || period.startsOn > current.startsOn)
    ) {
      current = period;
    }
  }
  return current?.recording ?? 'automatic';
}

// The periods after choosing a way of recording on a day.
export function withRecordingFrom(
  periods: readonly RecordingPeriod[],
  day: string,
  recording: TripRecording,
): RecordingPeriod[] {
  return [
    ...periods.filter((period) => period.startsOn !== day),
    { startsOn: day, recording },
  ].sort((first, second) => first.startsOn.localeCompare(second.startsOn));
}

// Only a trip that is not cancelled and whose day has come can be marked done.
export function canMarkDone(trip: DailyTrip, today: string): boolean {
  return !trip.cancelled && trip.serviceDate <= today;
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

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function extraCustomerError(customerId: string): OperationsProblem | null {
  return customerId.trim().length === 0 ? 'customer' : null;
}

export function departureTimeError(value: string): OperationsProblem | null {
  return timePattern.test(value) ? null : 'time';
}

// Arrival must be a clock time after departure on the same day.
export function arrivalTimeError(
  departureTime: string,
  arrivalTime: string,
): OperationsProblem | null {
  if (!timePattern.test(arrivalTime)) {
    return 'time';
  }
  if (
    timePattern.test(departureTime) &&
    minutesOf(arrivalTime) <= minutesOf(departureTime)
  ) {
    return 'arrival';
  }
  return null;
}

export function driverError(driverId: string): OperationsProblem | null {
  return driverId.length === 0 ? 'driver' : null;
}

export function tripPriceError(
  value: string,
  currency: Currency,
): OperationsProblem | null {
  return amountError(value, currency) ? 'tripPrice' : null;
}

export function extraTripError(
  details: ExtraTripDetails,
  currency: Currency,
  dayTrips: readonly DailyTrip[] = [],
): OperationsProblem | null {
  return (
    extraCustomerError(details.customerId) ??
    departureTimeError(details.departureTime) ??
    arrivalTimeError(details.departureTime, details.arrivalTime) ??
    driverError(details.driverId) ??
    tripPriceError(details.tripPrice, currency) ??
    notesError(details.notes, '') ??
    tripOccupancyError(
      {
        id: '',
        vehicleId: details.vehicleId,
        driverId: details.driverId,
        departureTime: details.departureTime,
        arrivalTime: details.arrivalTime,
        cancelled: false,
      },
      dayTrips,
    )
  );
}

// A cancel always needs a reason. Putting a cancelled trip back to running
// without changing the driver or vehicle clears the cancel and needs none.
// Any other running change still needs a reason so prepare leaves it alone.
export function tripChangeNeedsReason(
  change: TripChange,
  baseline: DailyTrip,
): boolean {
  if (change.cancelled) {
    return true;
  }
  if (baseline.cancelled) {
    return (
      change.driverId !== baseline.driverId ||
      change.vehicleId !== baseline.vehicleId
    );
  }
  return true;
}

export function tripChangeError(
  change: TripChange,
  baseline: DailyTrip,
  dayTrips: readonly DailyTrip[] = [],
): OperationsProblem | null {
  const driverProblem = driverError(change.driverId);
  if (driverProblem) {
    return driverProblem;
  }
  const fields =
    !tripChangeNeedsReason(change, baseline)
      ? notesError(change.notes, change.reason)
      : reasonError(change.reason) ?? notesError(change.notes, change.reason);
  if (fields) {
    return fields;
  }
  return tripOccupancyError(
    {
      id: baseline.id,
      vehicleId: change.vehicleId,
      driverId: change.driverId,
      departureTime: baseline.departureTime,
      arrivalTime: baseline.arrivalTime,
      cancelled: change.cancelled,
    },
    dayTrips,
  );
}

// Choosing a route fills in its customer, vehicle, and driver; the member may
// still change the vehicle and driver for this trip.
export function withRoute(
  details: ExtraTripDetails,
  routes: readonly OperationRoute[],
  routeId: string,
): ExtraTripDetails {
  const route = routes.find((item) => item.id === routeId);
  if (!route) {
    return { ...details, routeId: '' };
  }
  return {
    ...details,
    routeId: route.id,
    customerId: route.customerId,
    vehicleId: route.vehicleId,
    driverId: route.driverId,
  };
}

export function sortByTime(trips: readonly DailyTrip[]): DailyTrip[] {
  return [...trips].sort(
    (first, second) =>
      first.departureTime.localeCompare(second.departureTime) ||
      first.direction.localeCompare(second.direction),
  );
}

export type ConflictKind = 'vehicle' | 'driver';

export interface TripConflict {
  readonly kind: ConflictKind;
  readonly trip: DailyTrip;
}

export type ConflictCandidate = Pick<
  DailyTrip,
  | 'id'
  | 'vehicleId'
  | 'driverId'
  | 'departureTime'
  | 'arrivalTime'
  | 'cancelled'
>;

// Half-open [departure, arrival): ending when another starts is allowed.
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return (
    minutesOf(startA) < minutesOf(endB) && minutesOf(startB) < minutesOf(endA)
  );
}

// Other trips of the same day whose occupancy overlaps this vehicle or driver.
// Cancelled trips never conflict.
export function tripConflicts(
  candidate: ConflictCandidate,
  trips: readonly DailyTrip[],
): TripConflict[] {
  if (
    candidate.cancelled ||
    departureTimeError(candidate.departureTime) ||
    arrivalTimeError(candidate.departureTime, candidate.arrivalTime)
  ) {
    return [];
  }
  return trips
    .filter(
      (trip) =>
        trip.id !== candidate.id &&
        !trip.cancelled &&
        !departureTimeError(trip.departureTime) &&
        !arrivalTimeError(trip.departureTime, trip.arrivalTime) &&
        timesOverlap(
          candidate.departureTime,
          candidate.arrivalTime,
          trip.departureTime,
          trip.arrivalTime,
        ),
    )
    .flatMap((trip) => [
      ...(candidate.vehicleId && trip.vehicleId === candidate.vehicleId
        ? [{ kind: 'vehicle' as const, trip }]
        : []),
      ...(candidate.driverId && trip.driverId === candidate.driverId
        ? [{ kind: 'driver' as const, trip }]
        : []),
    ]);
}

export function tripOccupancyError(
  candidate: ConflictCandidate,
  trips: readonly DailyTrip[],
): OperationsProblem | null {
  const conflicts = tripConflicts(candidate, trips);
  if (conflicts.some((conflict) => conflict.kind === 'driver')) {
    return 'driverOverlap';
  }
  if (conflicts.some((conflict) => conflict.kind === 'vehicle')) {
    return 'vehicleOverlap';
  }
  return null;
}

export function conflictsByTrip(
  trips: readonly DailyTrip[],
): ReadonlyMap<string, TripConflict[]> {
  const conflicts = new Map<string, TripConflict[]>();
  for (const trip of trips) {
    const found = tripConflicts(trip, trips);
    if (found.length > 0) {
      conflicts.set(trip.id, found);
    }
  }
  return conflicts;
}

export interface TripFilter {
  readonly customerId: string;
  readonly direction: TripDirection | '';
  readonly status: TripStatus | '';
  readonly search: string;
  readonly conflictsOnly: boolean;
  readonly ownership: VehicleOwnership | '';
}

export const emptyTripFilter: TripFilter = {
  customerId: '',
  direction: '',
  status: '',
  search: '',
  conflictsOnly: false,
  ownership: '',
};

export function isVehicleOwnership(value: string): value is VehicleOwnership {
  return (vehicleOwnerships as readonly string[]).includes(value);
}

// Empty for a trip without a vehicle.
export function vehicleOwnership(
  vehicles: readonly OperationVehicle[],
  vehicleId: string,
): VehicleOwnership | '' {
  return vehicles.find((vehicle) => vehicle.id === vehicleId)?.ownership ?? '';
}

// Search matches the route name, the driver name, or the vehicle plate.
export function filterTrips(
  trips: readonly DailyTrip[],
  filter: TripFilter,
  choices: OperationChoices,
  today: string,
  recording: TripRecording,
): DailyTrip[] {
  const search = searchKey(filter.search);
  const conflicts = filter.conflictsOnly ? conflictsByTrip(trips) : null;
  return trips.filter(
    (trip) =>
      (!conflicts || conflicts.has(trip.id)) &&
      (!filter.ownership ||
        vehicleOwnership(choices.vehicles, trip.vehicleId) === filter.ownership) &&
      (!filter.customerId || trip.customerId === filter.customerId) &&
      (!filter.direction || trip.direction === filter.direction) &&
      (!filter.status ||
        tripStatus(trip, today, recording) === filter.status) &&
      (!search ||
        [
          choiceLabel(choices.routes, trip.routeId),
          choiceLabel(choices.drivers, trip.driverId),
          choiceLabel(choices.vehicles, trip.vehicleId),
        ].some((label) => searchKey(label).includes(search))),
  );
}

export function countByStatus(
  trips: readonly DailyTrip[],
  today: string,
  recording: TripRecording,
): Record<TripStatus, number> {
  const counts: Record<TripStatus, number> = {
    done: 0,
    planned: 0,
    cancelled: 0,
    unrecorded: 0,
  };
  for (const trip of trips) {
    counts[tripStatus(trip, today, recording)]++;
  }
  return counts;
}

// Customers with at least one trip on the day, plus the one already chosen,
// ordered by name.
export function customersOnDay(
  trips: readonly DailyTrip[],
  customers: readonly OperationChoice[],
  selectedId: string,
): OperationChoice[] {
  const ids = new Set(trips.map((trip) => trip.customerId));
  return customers
    .filter((customer) => ids.has(customer.id) || customer.id === selectedId)
    .sort((first, second) => first.label.localeCompare(second.label));
}

// Ignores case, spaces, Arabic digit forms, and common Arabic letter variants.
function searchKey(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/\s+/g, '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
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
export function availableChoices<Choice extends OperationChoice>(
  choices: readonly Choice[],
  selectedId: string,
): Choice[] {
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
