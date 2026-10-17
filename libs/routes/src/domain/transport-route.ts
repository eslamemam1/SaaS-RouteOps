import { amountError, Currency } from '@routeops/shared/money';

export interface RouteOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

// A customer, vehicle, or driver the route can point to.
export interface RouteChoice {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

export interface RouteChoices {
  readonly customers: readonly RouteChoice[];
  readonly vehicles: readonly RouteChoice[];
  readonly drivers: readonly RouteChoice[];
}

// Ordered as the week is read in Egypt and most Arab countries.
export const weekdays = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const;

export type Weekday = (typeof weekdays)[number];

export type WeekdaySelection = Readonly<Record<Weekday, boolean>>;

export interface TransportRouteDetails {
  readonly name: string;
  readonly customerId: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly startPoint: string;
  readonly endPoint: string;
  readonly outboundTime: string;
  readonly outboundArrivalTime: string;
  readonly returnTime: string;
  readonly returnArrivalTime: string;
  readonly days: WeekdaySelection;
  // What the customer pays for one day of the route, as the member types it in
  // the organization's currency, such as "150.50": a shift's whole price, or
  // the one trip's. Blank until a price is set.
  readonly tripPrice: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface TransportRoute extends TransportRouteDetails {
  readonly id: string;
}

export const routeLimits = {
  name: 200,
  point: 300,
  notes: 2000,
} as const;

export const routeProblems = [
  'name',
  'nameTaken',
  'customer',
  'driver',
  'startPoint',
  'endPoint',
  'tooLong',
  'time',
  'arrival',
  'trip',
  'days',
  'tripPrice',
  'inactiveChoice',
  'driverOverlap',
  'vehicleOverlap',
  'inUse',
  'load',
  'save',
  'remove',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type RouteProblem = (typeof routeProblems)[number];

export const emptyTransportRouteDetails: TransportRouteDetails = {
  name: '',
  customerId: '',
  vehicleId: '',
  driverId: '',
  startPoint: '',
  endPoint: '',
  outboundTime: '',
  outboundArrivalTime: '',
  returnTime: '',
  returnArrivalTime: '',
  days: {
    saturday: true,
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: false,
  },
  tripPrice: '',
  notes: '',
  active: true,
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return (
    minutesOf(startA) < minutesOf(endB) && minutesOf(startB) < minutesOf(endA)
  );
}

function requiredTextError(
  value: string,
  limit: number,
  missing: RouteProblem,
): RouteProblem | null {
  const text = value.trim();
  if (text.length === 0) {
    return missing;
  }
  return text.length > limit ? 'tooLong' : null;
}

export function routeNameError(value: string): RouteProblem | null {
  return requiredTextError(value, routeLimits.name, 'name');
}

export function startPointError(value: string): RouteProblem | null {
  return requiredTextError(value, routeLimits.point, 'startPoint');
}

export function endPointError(value: string): RouteProblem | null {
  return requiredTextError(value, routeLimits.point, 'endPoint');
}

export function customerError(value: string): RouteProblem | null {
  return value.length === 0 ? 'customer' : null;
}

export function driverError(value: string): RouteProblem | null {
  return value.length === 0 ? 'driver' : null;
}

export function optionalTextError(
  value: string,
  limit: number,
): RouteProblem | null {
  return value.trim().length > limit ? 'tooLong' : null;
}

export function timeError(value: string): RouteProblem | null {
  return value.length === 0 || timePattern.test(value) ? null : 'time';
}

// Arrival is required when that direction has a departure, and must be later.
export function arrivalError(
  departureTime: string,
  arrivalTime: string,
): RouteProblem | null {
  if (departureTime.length === 0) {
    return arrivalTime.length === 0 ? null : 'time';
  }
  if (arrivalTime.length === 0 || !timePattern.test(arrivalTime)) {
    return 'time';
  }
  if (!timePattern.test(departureTime)) {
    return null;
  }
  return minutesOf(arrivalTime) > minutesOf(departureTime) ? null : 'arrival';
}

export function tripError(
  outboundTime: string,
  returnTime: string,
): RouteProblem | null {
  return outboundTime.length === 0 && returnTime.length === 0 ? 'trip' : null;
}

// A route with both an outbound and a return trip is a shift, and its price
// is for the whole shift; otherwise its price is for its one trip.
export function isShift(route: {
  readonly outboundTime: string;
  readonly returnTime: string;
}): boolean {
  return route.outboundTime.length > 0 && route.returnTime.length > 0;
}

type ScheduleLeg = {
  readonly departureTime: string;
  readonly arrivalTime: string;
};

function routeLegs(route: {
  readonly outboundTime: string;
  readonly outboundArrivalTime: string;
  readonly returnTime: string;
  readonly returnArrivalTime: string;
}): ScheduleLeg[] {
  return [
    ...(route.outboundTime
      ? [
          {
            departureTime: route.outboundTime,
            arrivalTime: route.outboundArrivalTime,
          },
        ]
      : []),
    ...(route.returnTime
      ? [
          {
            departureTime: route.returnTime,
            arrivalTime: route.returnArrivalTime,
          },
        ]
      : []),
  ].filter(
    (leg) =>
      timePattern.test(leg.departureTime) && timePattern.test(leg.arrivalTime),
  );
}

function daysOverlap(
  first: WeekdaySelection,
  second: WeekdaySelection,
): boolean {
  return weekdays.some((day) => first[day] && second[day]);
}

// An active route must not put its driver or vehicle on overlapping legs with
// itself or another active route on a shared operating day.
export function routeScheduleOverlap(
  details: TransportRouteDetails,
  others: readonly TransportRoute[],
  routeId = '',
): RouteProblem | null {
  if (!details.active) {
    return null;
  }
  const legs = routeLegs(details);
  if (
    legs.length === 2 &&
    timesOverlap(
      legs[0].departureTime,
      legs[0].arrivalTime,
      legs[1].departureTime,
      legs[1].arrivalTime,
    )
  ) {
    return 'driverOverlap';
  }
  for (const other of others) {
    if (
      !other.active ||
      other.id === routeId ||
      !daysOverlap(details.days, other.days)
    ) {
      continue;
    }
    const sameDriver = details.driverId.length > 0 && details.driverId === other.driverId;
    const sameVehicle =
      details.vehicleId.length > 0 && details.vehicleId === other.vehicleId;
    if (!sameDriver && !sameVehicle) {
      continue;
    }
    for (const leg of legs) {
      for (const otherLeg of routeLegs(other)) {
        if (
          timesOverlap(
            leg.departureTime,
            leg.arrivalTime,
            otherLeg.departureTime,
            otherLeg.arrivalTime,
          )
        ) {
          return sameDriver ? 'driverOverlap' : 'vehicleOverlap';
        }
      }
    }
  }
  return null;
}

export function selectedDays(days: WeekdaySelection): Weekday[] {
  return weekdays.filter((day) => days[day]);
}

export function daysError(days: WeekdaySelection): RouteProblem | null {
  return selectedDays(days).length === 0 ? 'days' : null;
}

export function tripPriceError(
  value: string,
  currency: Currency,
): RouteProblem | null {
  return amountError(value, currency) ? 'tripPrice' : null;
}

// Keeps choices the user may pick now, plus the one already saved, so editing
// a route whose driver has stopped working does not silently drop the driver.
export function availableChoices(
  choices: readonly RouteChoice[],
  selectedId: string,
): RouteChoice[] {
  return choices.filter((choice) => choice.active || choice.id === selectedId);
}

export function choiceLabel(
  choices: readonly RouteChoice[],
  id: string,
): string {
  return choices.find((choice) => choice.id === id)?.label ?? '';
}

export function memberOrganization(
  memberships: readonly RouteOrganization[],
  requestedId: string,
): RouteOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}

// The same route name may serve several customers, so routes are grouped by
// customer first.
export function sortByCustomerAndName(
  routes: readonly TransportRoute[],
  customers: readonly RouteChoice[],
): TransportRoute[] {
  return [...routes].sort(
    (first, second) =>
      choiceLabel(customers, first.customerId).localeCompare(
        choiceLabel(customers, second.customerId),
      ) || first.name.localeCompare(second.name),
  );
}

export function routesOfCustomer(
  routes: readonly TransportRoute[],
  customerId: string,
): TransportRoute[] {
  return customerId.length === 0
    ? [...routes]
    : routes.filter((route) => route.customerId === customerId);
}

// Routes whose name, start or end point, customer, driver, or vehicle
// contains the search, ignoring case.
export function searchRoutes(
  routes: readonly TransportRoute[],
  search: string,
  choices: RouteChoices,
): TransportRoute[] {
  const needle = search.trim().toLocaleLowerCase();
  if (needle.length === 0) {
    return [...routes];
  }
  return routes.filter((route) =>
    [
      route.name,
      route.startPoint,
      route.endPoint,
      choiceLabel(choices.customers, route.customerId),
      choiceLabel(choices.drivers, route.driverId),
      choiceLabel(choices.vehicles, route.vehicleId),
    ].some((value) => value.toLocaleLowerCase().includes(needle)),
  );
}

// Starts a route for another customer from an existing one. The customer,
// vehicle, driver, and price are left for the user to choose.
export function copyForAnotherCustomer(
  route: TransportRoute,
): TransportRouteDetails {
  return {
    name: route.name,
    customerId: '',
    vehicleId: '',
    driverId: '',
    startPoint: route.startPoint,
    endPoint: route.endPoint,
    outboundTime: route.outboundTime,
    outboundArrivalTime: route.outboundArrivalTime,
    returnTime: route.returnTime,
    returnArrivalTime: route.returnArrivalTime,
    days: route.days,
    tripPrice: '',
    notes: '',
    active: true,
  };
}
