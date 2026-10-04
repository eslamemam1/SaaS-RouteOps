export interface VehicleOrganization {
  readonly id: string;
  readonly name: string;
}

export const vehicleTypes = ['bus', 'minibus', 'microbus', 'car'] as const;

export type VehicleType = (typeof vehicleTypes)[number];

export interface VehicleDetails {
  readonly plateNumber: string;
  readonly type: VehicleType | '';
  readonly model: string;
  readonly year: string;
  readonly seats: string;
  readonly licenseExpiry: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface Vehicle extends VehicleDetails {
  readonly id: string;
  readonly type: VehicleType;
}

export const vehicleLimits = {
  plateNumber: 20,
  model: 100,
  notes: 2000,
  earliestYear: 1950,
  seats: 100,
} as const;

export const vehicleProblems = [
  'plate',
  'plateTaken',
  'type',
  'tooLong',
  'year',
  'seats',
  'date',
  'load',
  'save',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type VehicleProblem = (typeof vehicleProblems)[number];

export const emptyVehicleDetails: VehicleDetails = {
  plateNumber: '',
  type: '',
  model: '',
  year: '',
  seats: '',
  licenseExpiry: '',
  notes: '',
  active: true,
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isVehicleType(value: string): value is VehicleType {
  return (vehicleTypes as readonly string[]).includes(value);
}

export function normalizePlate(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function plateError(value: string): VehicleProblem | null {
  const plate = normalizePlate(value);
  if (plate.length === 0) {
    return 'plate';
  }
  return plate.length > vehicleLimits.plateNumber ? 'tooLong' : null;
}

export function vehicleTypeError(value: string): VehicleProblem | null {
  return isVehicleType(value) ? null : 'type';
}

export function optionalTextError(
  value: string,
  limit: number,
): VehicleProblem | null {
  return value.trim().length > limit ? 'tooLong' : null;
}

// Accepts Arabic-Indic digits as well, because users often type them.
export function wholeNumber(value: string): number | null {
  const digits = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

export function yearError(
  value: string,
  currentYear: number,
): VehicleProblem | null {
  if (value.trim().length === 0) {
    return null;
  }
  const year = wholeNumber(value);
  return year !== null &&
    year >= vehicleLimits.earliestYear &&
    year <= currentYear + 1
    ? null
    : 'year';
}

export function seatsError(value: string): VehicleProblem | null {
  if (value.trim().length === 0) {
    return null;
  }
  const seats = wholeNumber(value);
  return seats !== null && seats >= 1 && seats <= vehicleLimits.seats
    ? null
    : 'seats';
}

export function dateError(value: string): VehicleProblem | null {
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
  memberships: readonly VehicleOrganization[],
  requestedId: string,
): VehicleOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}

export function sortByPlate(vehicles: readonly Vehicle[]): Vehicle[] {
  return [...vehicles].sort((first, second) =>
    first.plateNumber.localeCompare(second.plateNumber),
  );
}
