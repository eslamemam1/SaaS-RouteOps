import { Language } from '@routeops/shared/i18n';
import {
  ChangeReason,
  OperationsProblem,
  TripDirection,
  TripStatus,
} from '../domain/daily-trip';

export interface OperationsText {
  readonly problems: Record<OperationsProblem, string>;
  readonly directions: Record<TripDirection, string>;
  readonly statuses: Record<TripStatus, string>;
  readonly reasons: Record<ChangeReason, string>;
  readonly day: {
    readonly back: string;
    readonly title: string;
    readonly hint: string;
    readonly date: string;
    readonly previous: string;
    readonly next: string;
    readonly today: string;
    readonly loading: string;
    readonly empty: string;
    readonly time: string;
    readonly route: string;
    readonly customer: string;
    readonly direction: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly status: string;
    readonly reason: string;
    readonly notSet: string;
    readonly change: string;
  };
  readonly change: {
    readonly title: string;
    readonly hint: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly notSet: string;
    readonly cancelled: string;
    readonly reason: string;
    readonly chooseReason: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly save: string;
    readonly cancel: string;
  };
  readonly holiday: {
    readonly title: string;
    readonly hint: string;
    readonly none: string;
    readonly submit: string;
    readonly done: string;
  };
}

export const operationsText: Record<Language, OperationsText> = {
  ar: {
    problems: {
      reason: 'اختر سبب التغيير.',
      otherNotes: 'اكتب ملاحظة توضح السبب.',
      tooLong: 'النص أطول من المسموح.',
      date: 'اختر تاريخًا صحيحًا.',
      customers: 'اختر شركة واحدة على الأقل.',
      load: 'تعذّر تحميل رحلات اليوم. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    directions: {
      outbound: 'ذهاب',
      return: 'عودة',
    },
    statuses: {
      done: 'تمّت',
      planned: 'مخططة',
      cancelled: 'ملغاة',
    },
    reasons: {
      holiday: 'إجازة رسمية',
      vehicleBreakdown: 'عطل في المركبة',
      driverAbsent: 'غياب السائق',
      customerRequest: 'طلب من الشركة المتعاقدة',
      other: 'أخرى',
    },
    day: {
      back: 'الرجوع إلى الصفحة الرئيسية',
      title: 'التشغيل اليومي',
      hint: 'رحلات كل يوم كما حدثت فعلًا. كل رحلة تُحسب أنها تمّت إلا إذا ألغيتها. التغيير هنا ليوم واحد فقط ولا يغيّر الخط.',
      date: 'اليوم',
      previous: 'اليوم السابق',
      next: 'اليوم التالي',
      today: 'اليوم الحالي',
      loading: 'جارٍ تجهيز رحلات اليوم...',
      empty: 'لا توجد رحلات في هذا اليوم. تظهر هنا رحلات الخطوط التي تعمل في هذا اليوم من الأسبوع.',
      time: 'الميعاد',
      route: 'الخط',
      customer: 'الشركة المتعاقدة',
      direction: 'الرحلة',
      vehicle: 'المركبة',
      driver: 'السائق',
      status: 'الحالة',
      reason: 'السبب',
      notSet: 'لم يُحدد',
      change: 'تغيير',
    },
    change: {
      title: 'تغيير رحلة',
      hint: 'هذا التغيير لهذا اليوم فقط. لتغيير دائم، مثل سائق جديد بدل سائق ترك العمل، عدّل الخط من صفحة الخطوط.',
      vehicle: 'المركبة في هذا اليوم',
      driver: 'السائق في هذا اليوم',
      notSet: 'لم يُحدد',
      cancelled: 'أُلغيت هذه الرحلة',
      reason: 'السبب',
      chooseReason: 'اختر السبب',
      notes: 'ملاحظات',
      notesHint: 'مطلوبة إذا اخترت "أخرى".',
      save: 'حفظ التغيير',
      cancel: 'إلغاء',
    },
    holiday: {
      title: 'تسجيل إجازة',
      hint: 'اختر الشركات المتعاقدة التي لديها إجازة في هذا اليوم، وستُلغى كل رحلاتها بسبب "إجازة رسمية".',
      none: 'لا توجد رحلات قائمة لأي شركة في هذا اليوم.',
      submit: 'إلغاء رحلاتها في هذا اليوم',
      done: 'تم إلغاء رحلات الإجازة.',
    },
  },
  en: {
    problems: {
      reason: 'Choose the reason for the change.',
      otherNotes: 'Write a note that explains the reason.',
      tooLong: 'This text is too long.',
      date: 'Choose a valid date.',
      customers: 'Choose at least one company.',
      load: "Could not load the day's trips. Please try again.",
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    directions: {
      outbound: 'Outbound',
      return: 'Return',
    },
    statuses: {
      done: 'Done',
      planned: 'Planned',
      cancelled: 'Cancelled',
    },
    reasons: {
      holiday: 'Public holiday',
      vehicleBreakdown: 'Vehicle breakdown',
      driverAbsent: 'Driver absent',
      customerRequest: 'Client company request',
      other: 'Other',
    },
    day: {
      back: 'Back to home',
      title: 'Daily operations',
      hint: 'Each day\'s trips as they actually happened. A trip counts as done unless you cancel it. Changes here are for one day only and do not change the route.',
      date: 'Day',
      previous: 'Previous day',
      next: 'Next day',
      today: 'Today',
      loading: "Preparing the day's trips...",
      empty: 'There are no trips on this day. Trips of routes that run on this weekday appear here.',
      time: 'Time',
      route: 'Route',
      customer: 'Client company',
      direction: 'Trip',
      vehicle: 'Vehicle',
      driver: 'Driver',
      status: 'Status',
      reason: 'Reason',
      notSet: 'Not set',
      change: 'Change',
    },
    change: {
      title: 'Change trip',
      hint: 'This change is for this day only. For a lasting change, such as a new driver replacing one who left, edit the route on the Routes page.',
      vehicle: 'Vehicle on this day',
      driver: 'Driver on this day',
      notSet: 'Not set',
      cancelled: 'This trip was cancelled',
      reason: 'Reason',
      chooseReason: 'Choose a reason',
      notes: 'Notes',
      notesHint: 'Required if you choose "Other".',
      save: 'Save change',
      cancel: 'Cancel',
    },
    holiday: {
      title: 'Record a holiday',
      hint: 'Choose the client companies that are on holiday this day, and all their trips will be cancelled as "Public holiday".',
      none: 'No company has running trips on this day.',
      submit: 'Cancel their trips on this day',
      done: 'The holiday trips were cancelled.',
    },
  },
};
