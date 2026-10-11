// How trip_log says a trip counts: 'done' exactly when the reports count it,
// 'unrecorded' when manual recording still waits for a member to mark it.
export const tripStatuses = [
  'done',
  'unrecorded',
  'planned',
  'cancelled',
] as const;

export type TripStatus = (typeof tripStatuses)[number];

// A trip of the month so far. An id is empty when the trip names none; price is
// null when neither the trip nor its route has one.
export interface LoggedTrip {
  readonly id: string;
  readonly serviceDate: string;
  readonly departureTime: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly status: TripStatus;
  readonly price: number | null;
}

// An active driver or vehicle whose license expires within the warning period.
export interface LicenseHolder {
  readonly id: string;
  readonly name: string;
  readonly licenseExpiry: string;
}

// What the bell reads. Pay counts are about the month before, which is over.
export interface NotificationFacts {
  readonly trips: readonly LoggedTrip[];
  readonly unopenedDays: readonly string[];
  readonly unrecordedDriverPay: number;
  readonly unrecordedVehiclePay: number;
  readonly drivers: readonly LicenseHolder[];
  readonly vehicles: readonly LicenseHolder[];
}

export const notificationKinds = [
  'driverLicenseExpired',
  'vehicleLicenseExpired',
  'unopenedDays',
  'conflicts',
  'unrecordedTrips',
  'driverPay',
  'vehiclePay',
  'unpriced',
  'driverLicenseSoon',
  'vehicleLicenseSoon',
] as const;

export type NotificationKind = (typeof notificationKinds)[number];

export type NotificationSection =
  | 'operations'
  | 'expenses'
  | 'routes'
  | 'drivers'
  | 'vehicles';

// The page that fixes a notification, within the organization.
export interface NotificationLink {
  readonly section: NotificationSection;
  readonly id: string;
  readonly query: Readonly<Record<string, string>>;
}

// count is how many trips, days, drivers, or vehicles it is about; name and day
// say which driver or vehicle and when its license expires.
export interface Notification {
  readonly key: string;
  readonly kind: NotificationKind;
  readonly urgent: boolean;
  readonly count: number;
  readonly name: string;
  readonly day: string;
  readonly link: NotificationLink;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

// A license expiring within these days is announced before it expires.
export const licenseWarningDays = 30;

// Trips of the same vehicle or driver leaving less than this apart conflict,
// as on the daily operations screen.
export const conflictWindowMinutes = 60;

export function monthDays(today: string): DateRange {
  const [year, month] = today.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = today.slice(0, 7);
  return {
    from: `${prefix}-01`,
    to: `${prefix}-${String(last).padStart(2, '0')}`,
  };
}

export function previousMonthDays(today: string): DateRange {
  const [year, month] = today.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 2, 1));
  return monthDays(first.toISOString().slice(0, 10));
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isTripStatus(value: string): value is TripStatus {
  return (tripStatuses as readonly string[]).includes(value);
}

// Everything that needs a member, the urgent first. now is the local time as
// HH:MM: a trip of today waits for recording only once its time has come.
export function notifications(
  facts: NotificationFacts,
  today: string,
  now: string,
): Notification[] {
  const payMonth = previousMonthDays(today).from.slice(0, 7);
  const pastUnopened = facts.unopenedDays.filter((day) => day < today).sort();
  const unrecorded = facts.trips
    .filter(
      (trip) =>
        trip.status === 'unrecorded' &&
        (trip.serviceDate < today ||
          (trip.serviceDate === today &&
            trip.departureTime.slice(0, 5) <= now)),
    )
    .map((trip) => trip.serviceDate)
    .sort();
  const unpriced = facts.trips.filter(
    (trip) => trip.status === 'done' && trip.price === null,
  ).length;
  const conflicts = conflictingTrips(
    facts.trips.filter((trip) => trip.serviceDate === today),
  );
  const found: Notification[] = [
    ...licenseNotifications(facts.drivers, 'drivers', today),
    ...licenseNotifications(facts.vehicles, 'vehicles', today),
    group('unopenedDays', pastUnopened.length, true, {
      section: 'operations',
      id: '',
      query: { date: pastUnopened[0] ?? today },
    }),
    group('conflicts', conflicts, false, {
      section: 'operations',
      id: '',
      query: { date: today },
    }),
    group('unrecordedTrips', unrecorded.length, false, {
      section: 'operations',
      id: '',
      query: { date: unrecorded[0] ?? today },
    }),
    group('driverPay', facts.unrecordedDriverPay, false, {
      section: 'expenses',
      id: '',
      query: { month: payMonth },
    }),
    group('vehiclePay', facts.unrecordedVehiclePay, false, {
      section: 'expenses',
      id: '',
      query: { month: payMonth },
    }),
    group('unpriced', unpriced, false, {
      section: 'routes',
      id: '',
      query: {},
    }),
  ].filter((notification) => notification.count > 0);
  return found.sort(
    (first, second) =>
      Number(second.urgent) - Number(first.urgent) ||
      notificationKinds.indexOf(first.kind) -
        notificationKinds.indexOf(second.kind) ||
      first.day.localeCompare(second.day),
  );
}

// How many of the day's trips share a vehicle or driver with another trip
// leaving less than the conflict window apart. Cancelled trips never conflict.
export function conflictingTrips(trips: readonly LoggedTrip[]): number {
  const live = trips.filter((trip) => trip.status !== 'cancelled');
  return live.filter((trip) =>
    live.some(
      (other) =>
        other.id !== trip.id &&
        Math.abs(
          minutesOf(other.departureTime) - minutesOf(trip.departureTime),
        ) < conflictWindowMinutes &&
        ((trip.vehicleId !== '' && other.vehicleId === trip.vehicleId) ||
          (trip.driverId !== '' && other.driverId === trip.driverId)),
    ),
  ).length;
}

function licenseNotifications(
  holders: readonly LicenseHolder[],
  section: 'drivers' | 'vehicles',
  today: string,
): Notification[] {
  const last = addDays(today, licenseWarningDays);
  return holders
    .filter(
      (holder) => holder.licenseExpiry !== '' && holder.licenseExpiry <= last,
    )
    .map((holder) => {
      const expired = holder.licenseExpiry < today;
      const kind: NotificationKind =
        section === 'drivers'
          ? expired
            ? 'driverLicenseExpired'
            : 'driverLicenseSoon'
          : expired
            ? 'vehicleLicenseExpired'
            : 'vehicleLicenseSoon';
      return {
        key: `${kind}:${holder.id}`,
        kind,
        urgent: expired,
        count: 1,
        name: holder.name,
        day: holder.licenseExpiry,
        link: { section, id: holder.id, query: {} },
      };
    });
}

function group(
  kind: NotificationKind,
  count: number,
  urgent: boolean,
  link: NotificationLink,
): Notification {
  return { key: kind, kind, urgent, count, name: '', day: '', link };
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
