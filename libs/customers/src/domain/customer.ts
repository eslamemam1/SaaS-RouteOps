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

export const customerMessages = {
  name: 'أدخل اسم العميل.',
  tooLong: 'النص أطول من المسموح.',
  emailFormat: 'أدخل بريدًا إلكترونيًا صحيحًا.',
  load: 'تعذّر تحميل العملاء.',
  save: 'تعذّر حفظ بيانات العميل.',
  organization: 'هذه الشركة غير متاحة لحسابك.',
  signedOut: 'سجّل الدخول للمتابعة.',
  notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
} as const;

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

export function customerNameError(value: string): string | null {
  const name = value.trim();
  if (name.length === 0) {
    return customerMessages.name;
  }
  return name.length > customerLimits.name ? customerMessages.tooLong : null;
}

export function optionalTextError(value: string, limit: number): string | null {
  return value.trim().length > limit ? customerMessages.tooLong : null;
}

export function customerEmailError(value: string): string | null {
  const email = value.trim();
  if (email.length === 0) {
    return null;
  }
  if (email.length > customerLimits.email) {
    return customerMessages.tooLong;
  }
  return emailPattern.test(email) ? null : customerMessages.emailFormat;
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
