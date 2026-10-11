import { DriverPay } from '@routeops/shared/pay';

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

// A trip of the month that the driver drove, or that was planned for the
// driver and given to someone else. An id is empty when the trip names none;
// price is null when neither the trip nor its route has one. halves is how
// many halves of a full trip it is: 1 for one direction of an
// outbound-and-return route, 2 for any other trip.
export interface DriverTrip {
  readonly id: string;
  readonly serviceDate: string;
  readonly departureTime: string;
  readonly direction: TripDirection;
  readonly customerId: string;
  readonly routeId: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly plannedDriverId: string;
  readonly extra: boolean;
  readonly status: TripStatus;
  readonly reason: ChangeReason | '';
  readonly notes: string;
  readonly price: number | null;
  readonly halves: number;
}

// What the page shows for each trip from the driver's side: 'absent' when the
// driver missed it through absence, and 'handedOver' when another driver took
// it for any other reason.
export type DriverTripState = TripStatus | 'absent' | 'handedOver';

export interface WorkChoice {
  readonly id: string;
  readonly label: string;
}

export interface WorkRoute extends WorkChoice {
  readonly customerId: string;
}

// Names for the ids a trip or route holds. Inactive records stay, because past
// trips may still use them.
export interface WorkChoices {
  readonly customers: readonly WorkChoice[];
  readonly routes: readonly WorkRoute[];
  readonly vehicles: readonly WorkChoice[];
  readonly drivers: readonly WorkChoice[];
}

// An active route the driver drives now. Times are HH:MM, or empty for a
// direction the route does not run.
export interface DriverRoute {
  readonly id: string;
  readonly name: string;
  readonly customerId: string;
  readonly vehicleId: string;
  readonly outboundTime: string;
  readonly returnTime: string;
}

// unopenedDays are working days nobody opened, so their trips are missing.
// pay is null for a driver without pay terms.
export interface DriverMonth {
  readonly trips: readonly DriverTrip[];
  readonly pay: DriverPay | null;
  readonly unopenedDays: readonly string[];
}

// done and absent count each direction, as pay does; full, extraFull, and
// absentFull count full trips.
export interface DriverMonthTotals {
  readonly done: PerDirection;
  readonly extra: number;
  readonly absent: PerDirection;
  readonly full: number;
  readonly extraFull: number;
  readonly absentFull: number;
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

export function driverTripState(
  trip: DriverTrip,
  driverId: string,
): DriverTripState {
  if (trip.driverId !== driverId) {
    return trip.reason === 'driverAbsent' ? 'absent' : 'handedOver';
  }
  if (trip.status === 'cancelled' && trip.reason === 'driverAbsent') {
    return 'absent';
  }
  return trip.status;
}

// The same rule as driver_pay: a trip of a route planned for the driver whose
// day has come, cancelled or given to another driver because the driver was
// absent.
export function missedThroughAbsence(
  trip: DriverTrip,
  driverId: string,
  today: string,
): boolean {
  return (
    !trip.extra &&
    trip.plannedDriverId === driverId &&
    trip.reason === 'driverAbsent' &&
    trip.serviceDate <= today &&
    (trip.status === 'cancelled' || trip.driverId !== driverId)
  );
}

// Only the trips the driver drove count as done, at each trip's price.
export function driverTotals(
  trips: readonly DriverTrip[],
  driverId: string,
  today: string,
): DriverMonthTotals {
  const done = { outbound: 0, return: 0 };
  const absent = { outbound: 0, return: 0 };
  let extra = 0;
  let halves = 0;
  let extraHalves = 0;
  let absentHalves = 0;
  let revenue = 0;
  let unpriced = 0;
  for (const trip of trips) {
    if (missedThroughAbsence(trip, driverId, today)) {
      absent[trip.direction] += 1;
      absentHalves += trip.halves;
    }
    if (trip.driverId !== driverId || trip.status !== 'done') {
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
    absent,
    full: halves / 2,
    extraFull: extraHalves / 2,
    absentFull: absentHalves / 2,
    revenue,
    unpriced,
  };
}

export function choiceLabel(
  choices: readonly WorkChoice[],
  id: string,
): string {
  return choices.find((choice) => choice.id === id)?.label ?? '';
}
