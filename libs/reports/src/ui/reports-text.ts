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
    readonly revenue: string;
    readonly revenueTotal: string;
    readonly expensesTotal: string;
    readonly profitTotal: string;
    readonly profitHint: string;
    readonly expensesLink: string;
    readonly expenses: string;
    readonly profit: string;
    readonly loss: string;
    readonly vehicleExpensesHint: string;
    readonly routeHint: string;
    readonly driverShare: string;
    readonly vehicleShare: string;
    readonly companyShare: string;
    readonly otherCosts: string;
    readonly otherCostsHint: string;
    readonly unrecordedTitle: string;
    readonly unrecordedDrivers: string;
    readonly unrecordedVehicles: string;
    readonly unrecordedHint: string;
    readonly unpricedTitle: string;
    readonly unpricedHint: string;
    readonly unpricedTrips: string;
    readonly routesLink: string;
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
      route: 'الخطوط',
      vehicle: 'المركبات',
      driver: 'السائقون',
    },
    groupHeadings: {
      customer: 'الشركة المتعاقدة',
      route: 'الخط',
      vehicle: 'المركبة',
      driver: 'السائق',
    },
    missing: {
      customer: 'غير معروفة',
      route: 'رحلات إضافية بدون خط',
      vehicle: 'بدون مركبة',
      driver: 'بدون سائق',
    },
    report: {
      title: 'التقرير الشهري',
      hint: 'عدد الرحلات التي تمّت في الشهر وإيرادها ومصاريف الشهر وصافي الربح، لكل شركة متعاقدة وخط ومركبة وسائق. استخدمه في محاسبة الشركات والمركبات المؤجرة والمتعاقدين. الإيراد يُحسب من سعر الرحلة المسجّل لكل خط.',
      month: 'الشهر',
      previous: 'الشهر السابق',
      next: 'الشهر التالي',
      thisMonth: 'هذا الشهر',
      loading: 'جارٍ التحميل...',
      empty: 'لا توجد رحلات تمّت ولا مصاريف في هذا الشهر.',
      doneTotal: 'رحلات تمّت',
      extraTotal: 'منها رحلات إضافية',
      countedHint: 'لا تُحسب الرحلات الملغاة ولا رحلات الأيام التي لم تأتِ بعد. وإذا كنت تسجّل الرحلات بنفسك، تُحسب فقط الرحلات التي سجّلتها "تمّت".',
      groupBy: 'عرض حسب',
      ownership: 'الملكية',
      done: 'رحلات تمّت',
      extra: 'منها إضافية',
      revenue: 'الإيراد',
      revenueTotal: 'إيراد الرحلات التي تمّت',
      expensesTotal: 'مصاريف الشهر',
      profitTotal: 'صافي الربح',
      profitHint: 'صافي الربح = إيراد الرحلات التي تمّت − كل المصاريف المسجّلة لهذا الشهر في صفحة',
      expensesLink: 'المصاريف',
      expenses: 'المصاريف',
      profit: 'الربح',
      loss: 'خسارة',
      vehicleExpensesHint: 'ربح المركبة = إيراد رحلاتها − المصاريف المسجّلة عليها. المصاريف التي لا تخص مركبة بعينها، مثل المصاريف الإدارية، تظهر في سطر "بدون مركبة".',
      routeHint: 'نصيب الشركة من الخط = إيراد رحلاته − نصيب السائق − نصيب المركبة. نصيب السائق من راتبه المسجّل، ونصيب المركبة من أجرتها ووقودها وصيانتها وكل مصروف مسجّل عليها. ومن يعمل على أكثر من خط يتوزّع ما سُجّل له على خطوطه بعدد رحلاته في كل خط.',
      driverShare: 'نصيب السائق',
      vehicleShare: 'نصيب المركبة',
      companyShare: 'نصيب الشركة',
      otherCosts: 'مصاريف لا تخص خطًا بعينه',
      otherCostsHint: 'مثل مصاريف المكتب، أو مصاريف سائق أو مركبة لم تطلع رحلات هذا الشهر. صافي الربح = مجموع نصيب الشركة من الخطوط − هذه المصاريف.',
      unrecordedTitle: 'رواتب أو أجرة لم تُسجَّل بعد لهذا الشهر',
      unrecordedDrivers: 'سائقون:',
      unrecordedVehicles: 'مركبات:',
      unrecordedHint: 'نصيب السائق والمركبة يُحسب مما سُجّل في المصاريف، فيظهر نصيب الشركة أعلى من الحقيقي حتى تسجّلها من صفحة',
      unpricedTitle: 'رحلات بدون سعر',
      unpricedHint: 'لم تُحسب في الإيراد لأن خطها ليس له سعر. حدد سعر الرحلة لكل خط من صفحة',
      unpricedTrips: 'بدون سعر',
      routesLink: 'الخطوط',
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
      route: 'Routes',
      vehicle: 'Vehicles',
      driver: 'Drivers',
    },
    groupHeadings: {
      customer: 'Client company',
      route: 'Route',
      vehicle: 'Vehicle',
      driver: 'Driver',
    },
    missing: {
      customer: 'Unknown',
      route: 'Extra trips with no route',
      vehicle: 'No vehicle',
      driver: 'No driver',
    },
    report: {
      title: 'Monthly report',
      hint: 'How many trips were done in the month, their revenue, the month’s expenses, and net profit, per client company, route, vehicle, and driver. Use it to settle with client companies, rented vehicles, and contractors. Revenue comes from the trip price set on each route.',
      month: 'Month',
      previous: 'Previous month',
      next: 'Next month',
      thisMonth: 'This month',
      loading: 'Loading...',
      empty: 'No trips were done and no expenses were recorded in this month.',
      doneTotal: 'Trips done',
      extraTotal: 'of which extra trips',
      countedHint: 'Cancelled trips and trips on days still to come are not counted. If you record trips yourself, only trips you marked "Done" count.',
      groupBy: 'Show by',
      ownership: 'Ownership',
      done: 'Trips done',
      extra: 'of which extra',
      revenue: 'Revenue',
      revenueTotal: 'Revenue of the trips done',
      expensesTotal: 'Expenses this month',
      profitTotal: 'Net profit',
      profitHint: 'Net profit = revenue of the trips done − all expenses recorded for this month on the page',
      expensesLink: 'Expenses',
      expenses: 'Expenses',
      profit: 'Profit',
      loss: 'Loss',
      vehicleExpensesHint: 'Vehicle profit = its trip revenue − the expenses recorded on it. Expenses that are not for one vehicle, such as office costs, are on the "No vehicle" line.',
      routeHint: 'The company\'s share of a route = its trip revenue − the driver\'s share − the vehicle\'s share. The driver\'s share comes from the recorded salary, and the vehicle\'s share from its rent, fuel, maintenance, and every expense recorded on it. Whoever works several routes has what was recorded for them split over those routes by their trips on each.',
      driverShare: 'Driver\'s share',
      vehicleShare: 'Vehicle\'s share',
      companyShare: 'Company\'s share',
      otherCosts: 'Expenses not for one route',
      otherCostsHint: 'Such as office costs, or the costs of a driver or vehicle with no trips this month. Net profit = the company\'s share of all routes − these expenses.',
      unrecordedTitle: 'Salaries or vehicle pay not recorded yet this month',
      unrecordedDrivers: 'Drivers:',
      unrecordedVehicles: 'Vehicles:',
      unrecordedHint: 'Driver and vehicle shares come from recorded expenses, so the company\'s share looks higher than it is until you record them on the page',
      unpricedTitle: 'Trips without a price',
      unpricedHint: 'They are not in the revenue because their route has no price. Set the trip price of each route on the page',
      unpricedTrips: 'without a price',
      routesLink: 'Routes',
      unopenedTitle: 'Days not opened in daily operations',
      unopenedHint: 'The trips of these days are not in the report, because nobody opened them on the daily operations page. Open each of these days there to count it.',
      separator: ', ',
    },
  },
};
