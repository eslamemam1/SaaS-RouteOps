export interface RouteOrganization {
  readonly id: string;
  readonly name: string;
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
  readonly returnTime: string;
  readonly days: WeekdaySelection;
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
  'customer',
  'startPoint',
  'endPoint',
  'tooLong',
  'time',
  'trip',
  'days',
  'load',
  'save',
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
  returnTime: '',
  days: {
    saturday: true,
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: false,
  },
  notes: '',
  active: true,
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

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

export function optionalTextError(
  value: string,
  limit: number,
): RouteProblem | null {
  return value.trim().length > limit ? 'tooLong' : null;
}

export function timeError(value: string): RouteProblem | null {
  return value.length === 0 || timePattern.test(value) ? null : 'time';
}

export function tripError(
  outboundTime: string,
  returnTime: string,
): RouteProblem | null {
  return outboundTime.length === 0 && returnTime.length === 0 ? 'trip' : null;
}

export function selectedDays(days: WeekdaySelection): Weekday[] {
  return weekdays.filter((day) => days[day]);
}

export function daysError(days: WeekdaySelection): RouteProblem | null {
  return selectedDays(days).length === 0 ? 'days' : null;
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

export function sortByName(routes: readonly TransportRoute[]): TransportRoute[] {
  return [...routes].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}
