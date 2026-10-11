export const minimumPasswordLength = 6;

// The time zones a company may work in; its day starts and ends in it. Keep in
// sync with the organizations_time_zone_known check and the provision-company
// function.
export const timeZones = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Qatar',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Muscat',
  'Asia/Amman',
] as const;

export type TimeZone = (typeof timeZones)[number];

export const defaultTimeZone: TimeZone = 'Africa/Cairo';
export const maximumOrganizationNameLength = 200;

export const companyAccountProblems = [
  'organizationName',
  'organizationNameLength',
  'email',
  'emailFormat',
  'password',
  'currency',
  'timeZone',
  'emailTaken',
  'operatorOnly',
  'signIn',
  'signOut',
  'accountStatus',
  'load',
  'create',
  'signedOut',
  'notConnected',
  'login',
  'passwordChange',
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
