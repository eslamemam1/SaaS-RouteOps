export interface Organization {
  readonly id: string;
  readonly name: string;
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
