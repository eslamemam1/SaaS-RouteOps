export const minimumPasswordLength = 6;
export const maximumOrganizationNameLength = 200;

export const companyAccountMessages = {
  organizationName: 'Enter an organization name.',
  organizationNameLength: 'Use a shorter organization name.',
  email: 'Enter an email address.',
  emailFormat: 'Use a valid email address.',
  password: 'Use at least 6 characters for the password.',
  emailTaken: 'An account with that email already exists.',
  operatorOnly: 'Only the site operator can create a company.',
  signIn: 'Could not sign in.',
  load: 'Could not load organizations.',
  create: 'Could not create the company.',
  signedOut: 'Sign in to continue.',
  notConnected: 'The app is not connected to the database.',
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function organizationNameError(value: string): string | null {
  const name = value.trim();
  if (name.length === 0) {
    return companyAccountMessages.organizationName;
  }
  if (name.length > maximumOrganizationNameLength) {
    return companyAccountMessages.organizationNameLength;
  }
  return null;
}

export function emailError(value: string): string | null {
  const email = value.trim();
  if (email.length === 0) {
    return companyAccountMessages.email;
  }
  if (!emailPattern.test(email)) {
    return companyAccountMessages.emailFormat;
  }
  return null;
}

export function passwordError(value: string): string | null {
  if (value.length < minimumPasswordLength) {
    return companyAccountMessages.password;
  }
  return null;
}
