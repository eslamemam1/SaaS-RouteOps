export const minimumPasswordLength = 6;
export const maximumOrganizationNameLength = 200;

export const companyAccountMessages = {
  organizationName: 'أدخل اسم الشركة.',
  organizationNameLength: 'اسم الشركة أطول من المسموح.',
  email: 'أدخل البريد الإلكتروني.',
  emailFormat: 'أدخل بريدًا إلكترونيًا صحيحًا.',
  password: 'يجب ألا تقل كلمة المرور عن 6 أحرف.',
  emailTaken: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
  operatorOnly: 'إنشاء الشركات متاح لمدير الموقع فقط.',
  signIn: 'تعذّر تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.',
  load: 'تعذّر تحميل بيانات الشركة.',
  create: 'تعذّر إنشاء الشركة.',
  signedOut: 'سجّل الدخول للمتابعة.',
  notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
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
