import { Language } from '@routeops/shared/i18n';

export interface UiText {
  readonly optional: string;
  readonly close: string;
  readonly site: {
    readonly navigation: string;
    readonly home: string;
    readonly contact: string;
    readonly signIn: string;
    readonly openMenu: string;
    readonly closeMenu: string;
    readonly tagline: string;
  };
  readonly view: {
    readonly label: string;
    readonly table: string;
    readonly cards: string;
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
      openMenu: 'فتح القائمة',
      closeMenu: 'إغلاق القائمة',
      tagline: 'نظام لإدارة نقل الموظفين لشركات النقل.',
    },
    view: {
      label: 'طريقة العرض',
      table: 'جدول',
      cards: 'بطاقات',
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
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      tagline: 'Staff transport management for transport companies.',
    },
    view: {
      label: 'View',
      table: 'Table',
      cards: 'Cards',
    },
  },
};
