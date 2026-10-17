import { Language } from '@routeops/shared/i18n';
import {
  ReportGroup,
  ReportProblem,
  VehicleOwnership,
  VehicleType,
} from '../domain/trip-report';

export interface ReportsText {
  readonly problems: Record<ReportProblem, string>;
  readonly ownerships: Record<VehicleOwnership, string>;
  readonly vehicleTypes: Record<VehicleType, string>;
  readonly groups: Record<ReportGroup, string>;
  readonly groupHeadings: Record<ReportGroup, string>;
  readonly missing: Record<ReportGroup, string>;
  readonly views: {
    readonly summary: string;
    readonly invoice: string;
  };
  readonly report: {
    readonly title: string;
    readonly hint: string;
    readonly month: string;
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
    readonly management: string;
    readonly managementTotal: string;
    readonly sharedVehicles: string;
    readonly fromShare: string;
    readonly otherCosts: string;
    readonly otherCostsHint: string;
    readonly splitCostsHint: string;
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
  readonly invoice: {
    readonly title: string;
    readonly hint: string;
    readonly customer: string;
    readonly chooseCustomer: string;
    readonly from: string;
    readonly to: string;
    readonly thisMonth: string;
    readonly lastMonth: string;
    readonly serial: string;
    readonly route: string;
    readonly vehicleType: string;
    readonly trips: string;
    readonly rate: string;
    readonly lineTotal: string;
    readonly noRate: string;
    readonly noType: string;
    readonly extras: string;
    readonly empty: string;
    readonly pickCustomer: string;
    readonly grandTotal: string;
    readonly downloadExcel: string;
    readonly downloadPdf: string;
  };
}

export const reportsText: Record<Language, ReportsText> = {
  ar: {
    problems: {
      load: 'تعذّر تحميل التقرير. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
      date: 'اختر يومين صحيحين، على أن يكون اليوم الأول قبل اليوم الأخير أو هو نفسه، ولا يتجاوز اليوم الأخير اليوم.',
      tooManyDays: 'اختر 93 يومًا على الأكثر في المرة الواحدة.',
    },
    ownerships: {
      owned: 'ملك الشركة',
      rented: 'إيجار',
      contractor: 'مركبة مقاول',
    },
    vehicleTypes: {
      bus: 'أتوبيس',
      minibus: 'ميني باص',
      microbus: 'ميكروباص',
      car: 'سيارة',
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
    views: {
      summary: 'ملخص',
      invoice: 'فاتورة شركة',
    },
    report: {
      title: 'التقرير الشهري',
      hint: 'عدد الرحلات التي تمّت في الشهر وإيرادها ومصاريف الشهر وصافي الربح، لكل شركة متعاقدة وخط ومركبة وسائق. استخدمه في محاسبة الشركات والمركبات المؤجرة والمتعاقدين. الإيراد يُحسب من سعر الرحلة المسجّل لكل خط.',
      month: 'الشهر',
      loading: 'جارٍ التحميل...',
      empty: 'لا توجد رحلات تمّت ولا مصاريف في هذا الشهر.',
      doneTotal: 'رحلات كاملة تمّت',
      extraTotal: 'منها رحلات إضافية',
      countedHint: 'الذهاب والعودة معًا رحلة كاملة، والاتجاه الواحد منها نصف رحلة. لا تُحسب الرحلات الملغاة ولا رحلات الأيام التي لم تأتِ بعد. وإذا كنت تسجّل الرحلات بنفسك، تُحسب فقط الرحلات التي سجّلتها "تمّت".',
      groupBy: 'عرض حسب',
      ownership: 'الملكية',
      done: 'رحلات كاملة',
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
      management: 'فرق الإدارة',
      managementTotal: 'فرق الإدارة من كل الخطوط',
      sharedVehicles: 'صافي المركبات الملك (نصيبها − مصاريفها)',
      fromShare: 'من نصيبها',
      otherCosts: 'مصاريف لا تخص خطًا بعينه',
      otherCostsHint: 'مثل مصاريف المكتب، أو مصاريف سائق أو مركبة لم تقم برحلات هذا الشهر. صافي الربح = مجموع نصيب الشركة من الخطوط − هذه المصاريف.',
      splitCostsHint:
        'في الخطوط التي تقسّم سعر الوردية، نصيب المركبة هو حصتها من السعر، ومصاريفها تُخصم من حصتها لا من الخط. صافي الربح = مجموع نصيب الشركة من الخطوط + فرق الإدارة + صافي المركبات الملك − المصاريف التي لا تخص خطًا بعينه.',
      unrecordedTitle: 'رواتب أو أجرة لم تُسجَّل كاملة لهذا الشهر',
      unrecordedDrivers: 'سائقون:',
      unrecordedVehicles: 'مركبات:',
      unrecordedHint: 'صافي الربح ونصيب الشركة من كل خط يُحسبان مما سُجّل في المصاريف، فيظهران أعلى من الحقيقي حتى تسجّل ما بقي من صفحة',
      unpricedTitle: 'رحلات بدون سعر',
      unpricedHint: 'لم تُحسب في الإيراد لأنها بلا سعر، لا على الرحلة ولا على خطها. حدّد سعر الرحلة لكل خط، فتأخذه هذه الرحلات أيضًا، من صفحة',
      unpricedTrips: 'بدون سعر',
      routesLink: 'الخطوط',
      unopenedTitle: 'أيام لم تُفتح في التشغيل اليومي',
      unopenedHint: 'رحلات هذه الأيام غير محسوبة في التقرير، لأن أحدًا لم يفتحها في صفحة التشغيل اليومي. افتح كل يوم منها هناك ليُحسب.',
      separator: '، ',
    },
    invoice: {
      title: 'فاتورة شركة متعاقدة',
      hint: 'رحلات شركة متعاقدة في الفترة التي تختارها: كل خط ونوع مركبته وعدد الرحلات الكاملة وسعر الرحلة وإجماليها. اختر أي يومين، مثل من 26 إلى 25.',
      customer: 'الشركة المتعاقدة',
      chooseCustomer: 'اختر شركة',
      from: 'من يوم',
      to: 'إلى يوم',
      thisMonth: 'هذا الشهر حتى اليوم',
      lastMonth: 'الشهر الماضي',
      serial: 'م',
      route: 'الخط',
      vehicleType: 'نوع الخط',
      trips: 'عدد الرحلات',
      rate: 'السعر',
      lineTotal: 'إجمالي قيمة الرحلات',
      noRate: '—',
      noType: '—',
      extras: 'رحلات إضافية',
      empty: 'لا توجد رحلات تمّت لهذه الشركة في هذه الفترة.',
      pickCustomer: 'اختر شركة متعاقدة لعرض فاتورتها.',
      grandTotal: 'الإجمالي الكلي',
      downloadExcel: 'تحميل Excel',
      downloadPdf: 'تحميل PDF',
    },
  },
  en: {
    problems: {
      load: 'The report could not be loaded. Try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
      date: 'Choose two valid days, with the first on or before the last, and the last on or before today.',
      tooManyDays: 'Choose 93 days at most at a time.',
    },
    ownerships: {
      owned: 'Company owned',
      rented: 'Rented',
      contractor: 'Contractor vehicle',
    },
    vehicleTypes: {
      bus: 'Bus',
      minibus: 'Minibus',
      microbus: 'Microbus',
      car: 'Car',
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
    views: {
      summary: 'Summary',
      invoice: 'Company invoice',
    },
    report: {
      title: 'Monthly report',
      hint: 'How many trips were done in the month, their revenue, the month’s expenses, and net profit, per client company, route, vehicle, and driver. Use it to settle with client companies, rented vehicles, and contractors. Revenue comes from the trip price set on each route.',
      month: 'Month',
      loading: 'Loading...',
      empty: 'No trips were done and no expenses were recorded in this month.',
      doneTotal: 'Full trips done',
      extraTotal: 'of which extra trips',
      countedHint: 'An outbound and a return trip together are one full trip, and one direction alone is half a trip. Cancelled trips and trips on days still to come are not counted. If you record trips yourself, only trips you marked "Done" count.',
      groupBy: 'Show by',
      ownership: 'Ownership',
      done: 'Full trips',
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
      management: 'Management margin',
      managementTotal: 'Management margin of all routes',
      sharedVehicles: 'Company-owned vehicles\' net (their share − their expenses)',
      fromShare: 'from its share',
      otherCosts: 'Expenses not for one route',
      otherCostsHint: 'Such as office costs, or the costs of a driver or vehicle with no trips this month. Net profit = the company\'s share of all routes − these expenses.',
      splitCostsHint:
        'On routes that split the shift price, the vehicle\'s share is its part of the price, and its expenses come out of that part, not the route. Net profit = the company\'s share of all routes + the management margin + the company-owned vehicles\' net − the expenses not for one route.',
      unrecordedTitle: 'Salaries or vehicle pay not fully recorded this month',
      unrecordedDrivers: 'Drivers:',
      unrecordedVehicles: 'Vehicles:',
      unrecordedHint: 'Net profit and the company\'s share of each route come from recorded expenses, so they look higher than they are until you record what is left on the page',
      unpricedTitle: 'Trips without a price',
      unpricedHint: 'They are not in the revenue because neither the trip nor its route has a price. Set the trip price of each route, which these trips then take too, on the page',
      unpricedTrips: 'without a price',
      routesLink: 'Routes',
      unopenedTitle: 'Days not opened in daily operations',
      unopenedHint: 'The trips of these days are not in the report, because nobody opened them on the daily operations page. Open each of these days there to count it.',
      separator: ', ',
    },
    invoice: {
      title: 'Client company invoice',
      hint: 'Done trips of one client company in the period you choose: each route, its vehicle type, full trip count, unit rate, and line total. Pick any two days, such as the 26th to the 25th.',
      customer: 'Client company',
      chooseCustomer: 'Choose a company',
      from: 'From',
      to: 'To',
      thisMonth: 'This month to today',
      lastMonth: 'Last month',
      serial: '#',
      route: 'Route',
      vehicleType: 'Vehicle type',
      trips: 'Trips',
      rate: 'Rate',
      lineTotal: 'Trip total',
      noRate: '—',
      noType: '—',
      extras: 'Extra trips',
      empty: 'No trips were done for this company in this period.',
      pickCustomer: 'Choose a client company to show its invoice.',
      grandTotal: 'Grand total',
      downloadExcel: 'Download Excel',
      downloadPdf: 'Download PDF',
    },
  },
};
