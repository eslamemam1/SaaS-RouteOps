import { Language } from '@routeops/shared/i18n';

export interface UiText {
  readonly optional: string;
  readonly close: string;
  readonly site: {
    readonly navigation: string;
    readonly home: string;
    readonly contact: string;
    readonly signIn: string;
    readonly tagline: string;
  };
}

export const uiText: Record<Language, UiText> = {
  ar: {
    optional: '(اختياري)',
    close: 'إغلاق',
    site: {
      navigation: 'روابط الموقع',
      home: 'الرئيسية',
      contact: 'تواصل معنا',
      signIn: 'تسجيل الدخول',
      tagline: 'نظام لإدارة نقل الموظفين لشركات النقل.',
    },
  },
  en: {
    optional: '(optional)',
    close: 'Close',
    site: {
      navigation: 'Site links',
      home: 'Home',
      contact: 'Contact us',
      signIn: 'Sign in',
      tagline: 'Staff transport management for transport companies.',
    },
  },
};
