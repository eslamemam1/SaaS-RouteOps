import { Language } from '@routeops/shared/i18n';
import { NotificationKind } from '../domain/notification';

export interface NotificationsText {
  readonly title: string;
  readonly hint: string;
  readonly loading: string;
  readonly loadFailed: string;
  readonly retry: string;
  readonly refresh: string;
  readonly close: string;
  readonly empty: string;
  readonly emptyHint: string;
  readonly expiredOn: string;
  readonly expiresOn: string;
  readonly kinds: Readonly<
    Record<NotificationKind, { readonly title: string; readonly hint: string }>
  >;
}

export const notificationsText: Record<Language, NotificationsText> = {
  ar: {
    title: 'التنبيهات',
    hint: 'ما يحتاج إلى إجراء منك الآن. اضغط على أي تنبيه لتفتح الصفحة التي تعالجه.',
    loading: 'جارٍ تحميل التنبيهات...',
    loadFailed: 'تعذّر تحميل التنبيهات.',
    retry: 'إعادة المحاولة',
    refresh: 'تحديث التنبيهات',
    close: 'إغلاق التنبيهات',
    empty: 'لا توجد تنبيهات',
    emptyHint: 'كل شيء مسجّل ولا يحتاج شيء إلى انتباهك الآن.',
    expiredOn: 'انتهت في',
    expiresOn: 'تنتهي في',
    kinds: {
      driverLicenseExpired: {
        title: 'انتهت رخصة سائق',
        hint: 'جدّد الرخصة ثم عدّل تاريخ انتهائها في صفحة السائق.',
      },
      vehicleLicenseExpired: {
        title: 'انتهت رخصة مركبة',
        hint: 'جدّد الرخصة ثم عدّل تاريخ انتهائها في صفحة المركبة.',
      },
      unopenedDays: {
        title: 'أيام عمل لم تُفتح هذا الشهر',
        hint: 'رحلات هذه الأيام غير مسجّلة فلا تدخل في التقارير. اضغط لفتح أول يوم منها.',
      },
      conflicts: {
        title: 'تعارض في مواعيد اليوم',
        hint: 'مركبة أو سائق في رحلتين يفصل بينهما أقل من ساعة.',
      },
      unrecordedTrips: {
        title: 'رحلات فات موعدها ولم تُسجّل',
        hint: 'التسجيل يدوي، فعلّم الرحلات التي تمّت من صفحة التشغيل اليومي.',
      },
      driverPay: {
        title: 'رواتب سائقين لم تُسجّل',
        hint: 'الشهر الماضي انتهى، فسجّل ما بقي لهم من صفحة المصاريف.',
      },
      vehiclePay: {
        title: 'أجرة مركبات لم تُسجّل',
        hint: 'سجّل إيجار المركبات المؤجّرة وأجرة مركبات المقاولين عن الشهر الماضي.',
      },
      unpriced: {
        title: 'رحلات تمّت بلا سعر هذا الشهر',
        hint: 'أضف سعر الرحلة في صفحة الخط حتى يُحسب إيرادها.',
      },
      driverLicenseSoon: {
        title: 'رخصة سائق تنتهي قريبًا',
        hint: 'جدّدها قبل موعدها حتى لا يتوقف السائق عن العمل.',
      },
      vehicleLicenseSoon: {
        title: 'رخصة مركبة تنتهي قريبًا',
        hint: 'جدّدها قبل موعدها حتى لا تتوقف المركبة عن العمل.',
      },
    },
  },
  en: {
    title: 'Notifications',
    hint: 'What needs you now. Select a notification to open the page that fixes it.',
    loading: 'Loading notifications...',
    loadFailed: 'Could not load the notifications.',
    retry: 'Try again',
    refresh: 'Refresh notifications',
    close: 'Close notifications',
    empty: 'No notifications',
    emptyHint: 'Everything is recorded and nothing needs your attention now.',
    expiredOn: 'Expired on',
    expiresOn: 'Expires on',
    kinds: {
      driverLicenseExpired: {
        title: "A driver's license expired",
        hint: "Renew it, then update its expiry date on the driver's page.",
      },
      vehicleLicenseExpired: {
        title: "A vehicle's license expired",
        hint: "Renew it, then update its expiry date on the vehicle's page.",
      },
      unopenedDays: {
        title: 'Working days not opened this month',
        hint: 'Their trips are not recorded, so reports leave them out. Select to open the first one.',
      },
      conflicts: {
        title: "Time conflicts in today's trips",
        hint: 'A vehicle or driver has two trips less than an hour apart.',
      },
      unrecordedTrips: {
        title: 'Trips past their time and not recorded',
        hint: 'Trips are recorded by hand, so mark the done ones on the daily operations page.',
      },
      driverPay: {
        title: 'Driver pay not recorded',
        hint: 'Last month is over, so record what is left for them in expenses.',
      },
      vehiclePay: {
        title: 'Vehicle pay not recorded',
        hint: "Record last month's rent of rented vehicles and the pay of contractor vehicles.",
      },
      unpriced: {
        title: 'Done trips with no price this month',
        hint: 'Add a trip price on the route page so their revenue counts.',
      },
      driverLicenseSoon: {
        title: "A driver's license expires soon",
        hint: 'Renew it in time so the driver can keep working.',
      },
      vehicleLicenseSoon: {
        title: "A vehicle's license expires soon",
        hint: 'Renew it in time so the vehicle can keep working.',
      },
    },
  },
};
