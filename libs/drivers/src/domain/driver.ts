export interface DriverOrganization {
  readonly id: string;
  readonly name: string;
}

export interface DriverDetails {
  readonly fullName: string;
  readonly phone: string;
  readonly nationalId: string;
  readonly licenseNumber: string;
  readonly licenseExpiry: string;
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
  notes: '',
  active: true,
};

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
  return value
    .replace(/\s+/g, '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
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
