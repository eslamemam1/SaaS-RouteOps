export const minimumPasswordLength = 6;
export const maximumOrganizationNameLength = 200;

export const companyAccountProblems = [
  'organizationName',
  'organizationNameLength',
  'email',
  'emailFormat',
  'password',
  'currency',
  'emailTaken',
  'operatorOnly',
  'signIn',
  'signOut',
  'accountStatus',
  'load',
  'create',
  'signedOut',
  'notConnected',
] as const;

export type CompanyAccountProblem = (typeof companyAccountProblems)[number];

export function isCompanyAccountProblem(
  value: unknown,
): value is CompanyAccountProblem {
  return (
    typeof value === 'string' &&
    (companyAccountProblems as readonly string[]).includes(value)
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function organizationNameError(
  value: string,
): CompanyAccountProblem | null {
  const name = value.trim();
  if (name.length === 0) {
    return 'organizationName';
  }
  if (name.length > maximumOrganizationNameLength) {
    return 'organizationNameLength';
  }
  return null;
}

export function emailError(value: string): CompanyAccountProblem | null {
  const email = value.trim();
  if (email.length === 0) {
    return 'email';
  }
  if (!emailPattern.test(email)) {
    return 'emailFormat';
  }
  return null;
}

export function passwordError(value: string): CompanyAccountProblem | null {
  if (value.length < minimumPasswordLength) {
    return 'password';
  }
  return null;
}
