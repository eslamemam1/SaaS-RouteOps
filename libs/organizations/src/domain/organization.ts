import { Currency } from '@routeops/shared/money';

// The site operator stops an account whose monthly subscription is unpaid; its
// members then cannot use the company's records until it is turned back on.
export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
  readonly isActive: boolean;
}

// What the site operator sees of each company it provisioned.
export interface CompanyAccount {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
  readonly isActive: boolean;
  readonly logins: readonly string[];
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
}

export function activeOrganization(
  memberships: readonly Organization[],
  requestedId: string | null,
): Organization | null {
  if (memberships.length === 0) {
    return null;
  }
  if (requestedId === null) {
    return memberships.length === 1 ? memberships[0] : null;
  }
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}
