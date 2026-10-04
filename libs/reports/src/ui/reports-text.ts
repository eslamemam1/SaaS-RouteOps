import { Language } from '@routeops/shared/i18n';
import {
  ReportGroup,
  ReportProblem,
  VehicleOwnership,
} from '../domain/trip-report';

export interface ReportsText {
  readonly problems: Record<ReportProblem, string>;
  readonly ownerships: Record<VehicleOwnership, string>;
  readonly groups: Record<ReportGroup, string>;
  readonly groupHeadings: Record<ReportGroup, string>;
  readonly missing: Record<ReportGroup, string>;
  readonly report: {
    readonly back: string;
    readonly title: string;
    readonly hint: string;
    readonly month: string;
    readonly previous: string;
    readonly next: string;
    readonly thisMonth: string;
    readonly loading: string;
    readonly empty: string;
    readonly doneTotal: string;
    readonly extraTotal: string;
    readonly countedHint: string;
    readonly groupBy: string;
    readonly ownership: string;
    readonly done: string;
    readonly extra: string;
    readonly unopenedTitle: string;
    readonly unopenedHint: string;
    readonly separator: string;
  };
}

export const reportsText: Record<Language, ReportsText> = {
  ar: {
    problems: {
      load: 'تعذّر تحميل التقرير. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    ownerships: {
      owned: 'ملك الشركة',
      rented: 'إيجار',
      contractor: 'متعاقد بمركبته',
    },
    groups: {
      customer: 'الشركات المتعاقدة',
      vehicle: 'المركبات',
      driver: 'السائقون',
    },
    groupHeadings: {
      customer: 'الشركة المتعاقدة',
      vehicle: 'المركبة',
      driver: 'السائق',
    },
    missing: {
      customer: 'غير معروفة',
      vehicle: 'بدون مركبة',
      driver: 'بدون سائق',
    },
    report: {
      back: 'الرجوع إلى الصفحة الرئيسية',
      title: 'تقرير الرحلات الشهري',
      hint: 'عدد الرحلات التي تمّت في الشهر، لكل شركة متعاقدة ومركبة وسائق. استخدمه في محاسبة الشركات والمركبات المؤجرة والمتعاقدين.',
      month: 'الشهر',
      previous: 'الشهر السابق',
      next: 'الشهر التالي',
      thisMonth: 'هذا الشهر',
      loading: 'جارٍ التحميل...',
      empty: 'لا توجد رحلات تمّت في هذا الشهر.',
      doneTotal: 'رحلات تمّت',
      extraTotal: 'منها رحلات إضافية',
      countedHint: 'لا تُحسب الرحلات الملغاة ولا رحلات الأيام التي لم تأتِ بعد. وإذا كنت تسجّل الرحلات بنفسك، تُحسب فقط الرحلات التي سجّلتها "تمّت".',
      groupBy: 'عرض حسب',
      ownership: 'الملكية',
      done: 'رحلات تمّت',
      extra: 'منها إضافية',
      unopenedTitle: 'أيام لم تُفتح في التشغيل اليومي',
      unopenedHint: 'رحلات هذه الأيام غير محسوبة في التقرير، لأن أحدًا لم يفتحها في صفحة التشغيل اليومي. افتح كل يوم منها هناك ليُحسب.',
      separator: '، ',
    },
  },
  en: {
    problems: {
      load: 'The report could not be loaded. Try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    ownerships: {
      owned: 'Company owned',
      rented: 'Rented',
      contractor: 'Contractor vehicle',
    },
    groups: {
      customer: 'Client companies',
      vehicle: 'Vehicles',
      driver: 'Drivers',
    },
    groupHeadings: {
      customer: 'Client company',
      vehicle: 'Vehicle',
      driver: 'Driver',
    },
    missing: {
      customer: 'Unknown',
      vehicle: 'No vehicle',
      driver: 'No driver',
    },
    report: {
      back: 'Back to home',
      title: 'Monthly trip report',
      hint: 'How many trips were done in the month, per client company, vehicle, and driver. Use it to settle with client companies, rented vehicles, and contractors.',
      month: 'Month',
      previous: 'Previous month',
      next: 'Next month',
      thisMonth: 'This month',
      loading: 'Loading...',
      empty: 'No trips were done in this month.',
      doneTotal: 'Trips done',
      extraTotal: 'of which extra trips',
      countedHint: 'Cancelled trips and trips on days still to come are not counted. If you record trips yourself, only trips you marked "Done" count.',
      groupBy: 'Show by',
      ownership: 'Ownership',
      done: 'Trips done',
      extra: 'of which extra',
      unopenedTitle: 'Days not opened in daily operations',
      unopenedHint: 'The trips of these days are not in the report, because nobody opened them on the daily operations page. Open each of these days there to count it.',
      separator: ', ',
    },
  },
};
