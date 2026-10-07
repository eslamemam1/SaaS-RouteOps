import { Currency, toMinorUnits } from '@routeops/shared/money';

export interface DriverOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

// How the driver is paid: 'salary' for an employee with a monthly salary,
// 'perTrip' for a driver paid for each trip, or 'none' without pay terms.
export const payTypes = ['none', 'salary', 'perTrip'] as const;

export type PayType = (typeof payTypes)[number];

// monthlySalary, outboundPay, and returnPay are typed amounts in the
// organization currency; salaryTrips is a typed count. A salary may cover
// salaryTrips outbound and as many return trips a month; each done trip beyond
// them earns outboundPay or returnPay, and each trip missed through absence
// below them takes the same amount off. Without salaryTrips the salary is
// fixed. A driver paid per trip earns outboundPay or returnPay for every done
// trip. The expenses screen suggests a month's pay from them.
export interface DriverDetails {
  readonly fullName: string;
  readonly phone: string;
  readonly nationalId: string;
  readonly licenseNumber: string;
  readonly licenseExpiry: string;
  readonly payType: PayType;
  readonly monthlySalary: string;
  readonly salaryTrips: string;
  readonly outboundPay: string;
  readonly returnPay: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface Driver extends DriverDetails {
  readonly id: string;
}

export const driverLimits = {
  fullName: 200,
  phone: 50,
  nationalId: 30,
  licenseNumber: 50,
  notes: 2000,
} as const;

export const driverProblems = [
  'name',
  'tooLong',
  'nationalId',
  'nationalIdTaken',
  'date',
  'amount',
  'required',
  'trips',
  'load',
  'save',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type DriverProblem = (typeof driverProblems)[number];

export const emptyDriverDetails: DriverDetails = {
  fullName: '',
  phone: '',
  nationalId: '',
  licenseNumber: '',
  licenseExpiry: '',
  payType: 'none',
  monthlySalary: '',
  salaryTrips: '',
  outboundPay: '',
  returnPay: '',
  notes: '',
  active: true,
};

export const maxSalaryTrips = 999;

export function isPayType(value: string): value is PayType {
  return (payTypes as readonly string[]).includes(value);
}

// Accepts Arabic-Indic digits. Returns null for a blank text and undefined
// for a text that is not a whole number of trips above zero.
export function toTripCount(value: string): number | null | undefined {
  const text = toLatinDigits(value.trim());
  if (text.length === 0) {
    return null;
  }
  const count = /^\d+$/.test(text) ? Number(text) : 0;
  return count > 0 && count <= maxSalaryTrips ? count : undefined;
}

export function salaryError(
  value: string,
  payType: PayType,
  currency: Currency,
): DriverProblem | null {
  if (payType !== 'salary') {
    return null;
  }
  return amountProblem(value, currency, true);
}

// The trip count is optional, but the trip amounts mean nothing without it.
export function salaryTripsError(
  value: string,
  payType: PayType,
  outboundPay: string,
  returnPay: string,
): DriverProblem | null {
  if (payType !== 'salary') {
    return null;
  }
  const count = toTripCount(value);
  if (count === undefined) {
    return 'trips';
  }
  const amountsTyped = outboundPay.trim().length > 0 || returnPay.trim().length > 0;
  return count === null && amountsTyped ? 'required' : null;
}

// Needed for every driver paid per trip, and for a salary that covers a
// number of trips.
export function tripAmountError(
  value: string,
  payType: PayType,
  salaryTrips: string,
  currency: Currency,
): DriverProblem | null {
  switch (payType) {
    case 'none':
      return null;
    case 'salary':
      return amountProblem(value, currency, salaryTrips.trim().length > 0);
    case 'perTrip':
      return amountProblem(value, currency, true);
  }
}

function amountProblem(
  value: string,
  currency: Currency,
  required: boolean,
): DriverProblem | null {
  const minor = toMinorUnits(value, currency);
  if (minor === null) {
    return required ? 'required' : null;
  }
  return minor === undefined ? 'amount' : null;
}

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const nationalIdPattern = /^[0-9A-Za-z]+$/;

export function driverNameError(value: string): DriverProblem | null {
  const name = value.trim();
  if (name.length === 0) {
    return 'name';
  }
  return name.length > driverLimits.fullName ? 'tooLong' : null;
}

export function optionalTextError(
  value: string,
  limit: number,
): DriverProblem | null {
  return value.trim().length > limit ? 'tooLong' : null;
}

// Accepts Arabic-Indic digits and spaces, because users often type them.
export function normalizeNationalId(value: string): string {
  return toLatinDigits(value.replace(/\s+/g, ''));
}

export function nationalIdError(value: string): DriverProblem | null {
  const nationalId = normalizeNationalId(value);
  if (nationalId.length === 0) {
    return null;
  }
  if (nationalId.length > driverLimits.nationalId) {
    return 'tooLong';
  }
  return nationalIdPattern.test(nationalId) ? null : 'nationalId';
}

export function dateError(value: string): DriverProblem | null {
  if (value.length === 0) {
    return null;
  }
  if (!datePattern.test(value)) {
    return 'date';
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().startsWith(value)
    ? null
    : 'date';
}

// Both dates are YYYY-MM-DD, so text order is date order.
export function licenseExpired(licenseExpiry: string, today: string): boolean {
  return licenseExpiry.length > 0 && licenseExpiry < today;
}

export function memberOrganization(
  memberships: readonly DriverOrganization[],
  requestedId: string,
): DriverOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}

export function sortByName(drivers: readonly Driver[]): Driver[] {
  return [...drivers].sort((first, second) =>
    first.fullName.localeCompare(second.fullName),
  );
}
