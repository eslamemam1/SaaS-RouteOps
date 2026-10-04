export interface CustomerOrganization {
  readonly id: string;
  readonly name: string;
}

export interface CustomerDetails {
  readonly name: string;
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly notes: string;
  readonly active: boolean;
}

export interface Customer extends CustomerDetails {
  readonly id: string;
}

export const customerLimits = {
  name: 200,
  contactName: 200,
  phone: 50,
  email: 320,
  address: 500,
  notes: 2000,
} as const;

export const customerProblems = [
  'name',
  'tooLong',
  'emailFormat',
  'load',
  'save',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type CustomerProblem = (typeof customerProblems)[number];

export const emptyCustomerDetails: CustomerDetails = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  active: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function customerNameError(value: string): CustomerProblem | null {
  const name = value.trim();
  if (name.length === 0) {
    return 'name';
  }
  return name.length > customerLimits.name ? 'tooLong' : null;
}

export function optionalTextError(
  value: string,
  limit: number,
): CustomerProblem | null {
  return value.trim().length > limit ? 'tooLong' : null;
}

export function customerEmailError(value: string): CustomerProblem | null {
  const email = value.trim();
  if (email.length === 0) {
    return null;
  }
  if (email.length > customerLimits.email) {
    return 'tooLong';
  }
  return emailPattern.test(email) ? null : 'emailFormat';
}

export function memberOrganization(
  memberships: readonly CustomerOrganization[],
  requestedId: string,
): CustomerOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}

export function sortByName(customers: readonly Customer[]): Customer[] {
  return [...customers].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}
