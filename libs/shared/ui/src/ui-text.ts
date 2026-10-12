import { Language } from '@routeops/shared/i18n';

export interface UiText {
  readonly optional: string;
  readonly close: string;
  readonly retry: string;
  readonly site: {
    readonly navigation: string;
    readonly home: string;
    readonly pricing: string;
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
  readonly monthPicker: {
    readonly previous: string;
    readonly next: string;
    readonly previousYear: string;
    readonly nextYear: string;
    readonly thisMonth: string;
  };
  readonly dayPicker: {
    readonly previousMonth: string;
    readonly nextMonth: string;
    readonly today: string;
  };
  readonly timePicker: {
    readonly label: string;
    readonly placeholder: string;
    readonly hour: string;
    readonly minute: string;
    readonly period: string;
    readonly am: string;
    readonly pm: string;
    readonly clear: string;
    readonly done: string;
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
      pricing: 'الأسعار',
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
    monthPicker: {
      previous: 'الشهر السابق',
      next: 'الشهر التالي',
      previousYear: 'السنة السابقة',
      nextYear: 'السنة التالية',
      thisMonth: 'الشهر الحالي',
    },
    dayPicker: {
      previousMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      today: 'اليوم',
    },
    timePicker: {
      label: 'اختيار الميعاد',
      placeholder: 'اختر الميعاد',
      hour: 'الساعة',
      minute: 'الدقيقة',
      period: 'صباحًا أو مساءً',
      am: 'ص',
      pm: 'م',
      clear: 'مسح الميعاد',
      done: 'تم',
    },
  },
  en: {
    optional: '(optional)',
    close: 'Close',
    retry: 'Try again',
    site: {
      navigation: 'Site links',
      home: 'Home',
      pricing: 'Pricing',
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
    monthPicker: {
      previous: 'Previous month',
      next: 'Next month',
      previousYear: 'Previous year',
      nextYear: 'Next year',
      thisMonth: 'This month',
    },
    dayPicker: {
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      today: 'Today',
    },
    timePicker: {
      label: 'Choose a time',
      placeholder: 'Choose a time',
      hour: 'Hour',
      minute: 'Minute',
      period: 'AM or PM',
      am: 'AM',
      pm: 'PM',
      clear: 'Clear time',
      done: 'Done',
    },
  },
};
