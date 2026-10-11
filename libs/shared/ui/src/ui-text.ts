import { Language } from '@routeops/shared/i18n';

export interface UiText {
  readonly optional: string;
  readonly close: string;
  readonly retry: string;
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
  readonly pager: {
    readonly label: string;
    readonly showing: string;
    readonly of: string;
    readonly previous: string;
    readonly next: string;
    readonly page: string;
    readonly perPage: string;
  };
}

export const uiText: Record<Language, UiText> = {
  ar: {
    optional: '(اختياري)',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
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
    pager: {
      label: 'صفحات القائمة',
      showing: 'عرض',
      of: 'من',
      previous: 'الصفحة السابقة',
      next: 'الصفحة التالية',
      page: 'صفحة',
      perPage: 'عدد الصفوف في الصفحة',
    },
  },
  en: {
    optional: '(optional)',
    close: 'Close',
    retry: 'Try again',
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
    pager: {
      label: 'List pages',
      showing: 'Showing',
      of: 'of',
      previous: 'Previous page',
      next: 'Next page',
      page: 'Page',
      perPage: 'Rows per page',
    },
  },
};
