import { Language } from '@routeops/shared/i18n';
import { RentType, VehicleOwnership, VehicleProblem, VehicleType } from '../domain/vehicle';
import {
  ChangeReason,
  ExpenseCategory,
  TripDirection,
  TripStatus,
} from '../domain/vehicle-month';

export interface VehiclesText {
  readonly problems: Record<VehicleProblem, string>;
  readonly types: Record<VehicleType, string>;
  readonly ownerships: Record<VehicleOwnership, string>;
  readonly rentTypes: Record<RentType, string>;
  readonly directions: Record<TripDirection, string>;
  readonly statuses: Record<TripStatus, string>;
  readonly reasons: Record<ChangeReason, string>;
  readonly categories: Record<ExpenseCategory, string>;
  readonly page: {
    readonly back: string;
    readonly loading: string;
    readonly notFound: string;
    readonly licenseExpired: string;
    readonly edit: string;
    readonly owner: string;
    readonly monthTitle: string;
    readonly month: string;
    readonly monthLoading: string;
    readonly loadFailed: string;
    readonly unopenedTitle: string;
    readonly unopenedHint: string;
    readonly separator: string;
    readonly done: string;
    readonly extra: string;
    readonly extraDetail: string;
    readonly revenue: string;
    readonly unpriced: string;
    readonly expenses: string;
    readonly profit: string;
    readonly loss: string;
    readonly countedHint: string;
    readonly rentTitle: string;
    readonly rentHint: string;
    readonly contractorHint: string;
    readonly monthlyRent: string;
    readonly tripsRent: string;
    readonly recorded: string;
    readonly remaining: string;
    readonly rentLink: string;
    readonly expensesTitle: string;
    readonly expensesHint: string;
    readonly noExpenses: string;
    readonly expensesTotal: string;
    readonly expensesLink: string;
    readonly detailsTitle: string;
    readonly notSet: string;
    readonly ownerPhone: string;
    readonly outboundRent: string;
    readonly returnRent: string;
    readonly notes: string;
    readonly routesTitle: string;
    readonly routesHint: string;
    readonly noRoutes: string;
    readonly tripsTitle: string;
    readonly tripsHint: string;
    readonly noTrips: string;
    readonly day: string;
    readonly trip: string;
    readonly driver: string;
    readonly state: string;
    readonly reason: string;
    readonly extraTag: string;
    readonly noRoute: string;
  };
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly open: string;
    readonly filter: string;
    readonly allOwnerships: string;
    readonly noMatch: string;
    readonly plateNumber: string;
    readonly type: string;
    readonly ownership: string;
    readonly model: string;
    readonly year: string;
    readonly seats: string;
    readonly licenseExpiry: string;
    readonly expired: string;
    readonly service: string;
    readonly inService: string;
    readonly outOfService: string;
    readonly edit: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly plateNumber: string;
    readonly plateNumberHint: string;
    readonly type: string;
    readonly chooseType: string;
    readonly model: string;
    readonly modelHint: string;
    readonly year: string;
    readonly seats: string;
    readonly seatsHint: string;
    readonly licenseExpiry: string;
    readonly licenseExpiryHint: string;
    readonly ownership: string;
    readonly ownershipHint: string;
    readonly ownerName: string;
    readonly ownerNameHint: string;
    readonly ownerPhone: string;
    readonly rentType: string;
    readonly rentTypeHint: string;
    readonly monthlyRent: string;
    readonly amountHint: string;
    readonly tripRentHint: string;
    readonly outboundRent: string;
    readonly returnRent: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly active: string;
    readonly activeHint: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly added: string;
    readonly saved: string;
  };
}

export const vehiclesText: Record<Language, VehiclesText> = {
  ar: {
    problems: {
      plate: 'أدخل رقم اللوحة.',
      plateTaken: 'رقم اللوحة هذا مسجّل بالفعل لمركبة أخرى.',
      type: 'اختر نوع المركبة.',
      ownerName: 'اكتب اسم صاحب المركبة أو المكتب.',
      amount: 'أدخل المبلغ بالأرقام فقط، مثل 12000 أو 12000.50',
      required: 'هذه الخانة مطلوبة.',
      tooLong: 'النص أطول من المسموح.',
      year: 'أدخل سنة صحيحة من 1950 حتى العام القادم، مثل 2020.',
      seats: 'أدخل عدد مقاعد صحيحًا من 1 إلى 100.',
      date: 'أدخل تاريخًا صحيحًا.',
      activeRoutes: 'لا يمكن إيقاف هذه المركبة لأنها تعمل على هذه الخطوط. اختر لها مركبة أخرى أو أوقفها من صفحة الخطوط أولًا:',
      vehicleLimit: 'وصلتم إلى أقصى عدد من المركبات العاملة في باقتكم. أوقف مركبة أخرى أولًا، أو تواصل معنا لترقية الباقة.',
      load: 'تعذّر تحميل المركبات. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    types: {
      bus: 'أتوبيس',
      minibus: 'ميني باص',
      microbus: 'ميكروباص',
      car: 'سيارة ملاكي',
    },
    ownerships: {
      owned: 'ملك الشركة',
      rented: 'إيجار',
      contractor: 'مركبة مقاول',
    },
    rentTypes: {
      none: 'لم يُحدَّد بعد',
      monthly: 'مبلغ شهري ثابت',
      perTrip: 'بالرحلة',
    },
    directions: {
      outbound: 'ذهاب',
      return: 'عودة',
    },
    statuses: {
      done: 'تمّت',
      unrecorded: 'لم تُسجَّل بعد',
      planned: 'مخططة',
      cancelled: 'ملغاة',
    },
    reasons: {
      holiday: 'إجازة',
      vehicleBreakdown: 'عطل في المركبة',
      driverAbsent: 'غياب السائق',
      customerRequest: 'طلب من الشركة المتعاقدة',
      other: 'أخرى',
    },
    categories: {
      fuel: 'وقود',
      maintenance: 'صيانة وقطع غيار',
      salaries: 'رواتب وأجور',
      rent: 'إيجار مركبات',
      contractors: 'مستحقات المقاولين',
      licenses: 'تراخيص وتأمين',
      tolls: 'رسوم طرق وكارتة',
      office: 'مصاريف إدارية',
      other: 'أخرى',
    },
    page: {
      back: 'كل المركبات',
      loading: 'جارٍ تحميل صفحة المركبة...',
      notFound: 'لم نجد هذه المركبة. ربما فتحت رابطًا قديمًا.',
      licenseExpired: 'الرخصة منتهية',
      edit: 'تعديل البيانات',
      owner: 'صاحبها:',
      monthTitle: 'شغل شهر',
      month: 'الشهر',
      monthLoading: 'جارٍ تحميل رحلات الشهر...',
      loadFailed: 'تعذّر تحميل بيانات الشهر. حاول مرة أخرى.',
      unopenedTitle: 'أيام عمل لم تُفتح',
      unopenedHint:
        'لم يفتح أحد صفحة التشغيل اليومي في هذه الأيام، فلا توجد رحلات مسجّلة لها ولا تدخل في العدد. افتح كل يوم منها لتُضاف رحلاته:',
      separator: '، ',
      done: 'رحلات كاملة قامت بها',
      extra: 'رحلات إضافية',
      extraDetail: 'خارج الخطوط المعتادة',
      revenue: 'إيراد رحلاتها',
      unpriced: 'رحلة بلا سعر',
      expenses: 'مصاريفها',
      profit: 'ربحها',
      loss: 'خسارة',
      countedHint:
        'تُحسب الرحلات والربح بنفس طريقة التقارير: الرحلة المنفّذة فقط، والمصاريف المسجّلة على هذه المركبة. الذهاب والعودة معًا رحلة كاملة، والاتجاه الواحد منها نصف رحلة.',
      rentTitle: 'أجرة الشهر لصاحبها',
      rentHint:
        'الأجرة المقترحة من شروط إيجارها في هذا الشهر والرحلات التي قامت بها. تُسجَّل من صفحة المصاريف كمصروف إيجار مركبات.',
      contractorHint:
        'الأجرة المقترحة من شروط المقاول في هذا الشهر والرحلات التي قامت بها. تُسجَّل من صفحة المصاريف كمستحقات مقاولين.',
      monthlyRent: 'الأجرة الشهرية',
      tripsRent: 'أجرة الرحلات',
      recorded: 'المسجّل في المصاريف',
      remaining: 'المتبقي',
      rentLink: 'تسجيل الأجرة من صفحة المصاريف',
      expensesTitle: 'مصاريف الشهر',
      expensesHint: 'كل مصروف سُجّل على هذه المركبة في هذا الشهر.',
      noExpenses: 'لم يُسجَّل أي مصروف على هذه المركبة في هذا الشهر.',
      expensesTotal: 'الإجمالي',
      expensesLink: 'فتح صفحة المصاريف',
      detailsTitle: 'بيانات المركبة',
      notSet: 'غير مسجّل',
      ownerPhone: 'هاتف صاحبها',
      outboundRent: 'مبلغ رحلة الذهاب',
      returnRent: 'مبلغ رحلة العودة',
      notes: 'ملاحظات',
      routesTitle: 'خطوطها الحالية',
      routesHint: 'الخطوط العاملة التي تعمل عليها هذه المركبة الآن.',
      noRoutes: 'لا تعمل على أي خط عامل حاليًا.',
      tripsTitle: 'رحلات الشهر',
      tripsHint: 'كل رحلة قامت بها هذه المركبة أو كانت مخططة لها في هذا الشهر.',
      noTrips: 'لا توجد رحلات لهذه المركبة في هذا الشهر.',
      day: 'اليوم',
      trip: 'الرحلة',
      driver: 'السائق',
      state: 'الحالة',
      reason: 'السبب والملاحظات',
      extraTag: 'إضافية',
      noRoute: 'رحلة بدون خط',
    },
    list: {
      title: 'المركبات',
      add: 'إضافة مركبة',
      hint: 'الأتوبيسات والميكروباصات والسيارات التي تنقل بها الموظفين، سواء كانت ملكك أو إيجارًا أو تخص مقاولًا يعمل معك. اضغط رقم اللوحة لترى صفحة المركبة ورحلاتها في كل شهر.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي مركبة بعد. ابدأ بإضافة أول مركبة.',
      open: 'صفحة المركبة',
      filter: 'عرض حسب الملكية',
      allOwnerships: 'كل المركبات',
      noMatch: 'لا توجد مركبات من هذا النوع.',
      plateNumber: 'رقم اللوحة',
      type: 'النوع',
      ownership: 'الملكية',
      model: 'الموديل',
      year: 'سنة الصنع',
      seats: 'المقاعد',
      licenseExpiry: 'انتهاء الرخصة',
      expired: 'منتهية',
      service: 'الحالة',
      inService: 'في الخدمة',
      outOfService: 'خارج الخدمة',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة مركبة جديدة',
      editTitle: 'تعديل بيانات المركبة',
      plateNumber: 'رقم اللوحة',
      plateNumberHint: 'اكتبه كما هو مكتوب على اللوحة، مثل: أ ب ج 1234.',
      type: 'نوع المركبة',
      chooseType: 'اختر النوع',
      model: 'الماركة والموديل',
      modelHint: 'مثل: تويوتا هايس.',
      year: 'سنة الصنع',
      seats: 'عدد المقاعد',
      seatsHint: 'عدد الركاب الذين تتسع لهم المركبة.',
      licenseExpiry: 'تاريخ انتهاء الرخصة',
      licenseExpiryHint: 'تظهر كلمة "منتهية" في القائمة بعد هذا التاريخ.',
      ownership: 'ملكية المركبة',
      ownershipHint: 'إيجار: مركبة تستأجرها من صاحبها أو من مكتب. مركبة مقاول: مقاول يعمل معك بمركبته ويأخذ أجرته منك.',
      ownerName: 'اسم صاحب المركبة أو المكتب',
      ownerNameHint: 'الشخص الذي تحاسبه على هذه المركبة.',
      ownerPhone: 'رقم هاتف صاحبها',
      rentType: 'طريقة حساب أجرة المركبة',
      rentTypeHint: 'تقترح صفحة المصاريف أجرته كل شهر، وتظهر في حساب كل خط. أي تغيير هنا يسري من الشهر الحالي، وتبقى الشهور السابقة على حسابها القديم.',
      monthlyRent: 'الأجرة الشهرية',
      amountHint: 'بالأرقام فقط، مثل 12000 أو 12000.50',
      tripRentHint: 'يأخذ صاحبها عن كل رحلة قامت بها المركبة مبلغ اتجاهها، وقد يختلف الذهاب عن العودة.',
      outboundRent: 'مبلغ رحلة الذهاب',
      returnRent: 'مبلغ رحلة العودة',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذه المركبة.',
      active: 'المركبة في الخدمة',
      activeHint: 'لا تظهر المركبة الموقوفة عند اختيار مركبة لخط أو رحلة، وتبقى رحلاتها ومصاريفها السابقة كما هي.',
      add: 'إضافة المركبة',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة المركبة.',
      saved: 'تم حفظ التعديلات.',
    },
  },
  en: {
    problems: {
      plate: 'Enter the plate number.',
      plateTaken: 'This plate number is already used by another vehicle.',
      type: 'Choose the vehicle type.',
      ownerName: "Enter the vehicle owner's or office's name.",
      amount: 'Enter the amount in digits only, like 12000 or 12000.50',
      required: 'This field is required.',
      tooLong: 'This text is too long.',
      year: 'Enter a valid year from 1950 to next year, e.g. 2020.',
      seats: 'Enter a seat count from 1 to 100.',
      date: 'Enter a valid date.',
      activeRoutes: 'This vehicle cannot be made inactive because it runs these active routes. Give them another vehicle or stop them on the routes page first:',
      vehicleLimit: 'You have reached the most active vehicles your plan allows. Make another vehicle inactive first, or contact us to upgrade your plan.',
      load: 'Could not load your vehicles. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    types: {
      bus: 'Bus',
      minibus: 'Minibus',
      microbus: 'Microbus',
      car: 'Car',
    },
    ownerships: {
      owned: 'Company owned',
      rented: 'Rented',
      contractor: 'Contractor vehicle',
    },
    rentTypes: {
      none: 'Not set yet',
      monthly: 'Fixed monthly amount',
      perTrip: 'Per trip',
    },
    directions: {
      outbound: 'Outbound',
      return: 'Return',
    },
    statuses: {
      done: 'Done',
      unrecorded: 'Not recorded yet',
      planned: 'Planned',
      cancelled: 'Cancelled',
    },
    reasons: {
      holiday: 'Holiday',
      vehicleBreakdown: 'Vehicle breakdown',
      driverAbsent: 'Driver absent',
      customerRequest: 'Client company request',
      other: 'Other',
    },
    categories: {
      fuel: 'Fuel',
      maintenance: 'Maintenance and parts',
      salaries: 'Salaries and wages',
      rent: 'Vehicle rent',
      contractors: 'Contractor payments',
      licenses: 'Licenses and insurance',
      tolls: 'Road tolls',
      office: 'Office costs',
      other: 'Other',
    },
    page: {
      back: 'All vehicles',
      loading: 'Loading the vehicle page...',
      notFound: 'This vehicle was not found. The link may be old.',
      licenseExpired: 'License expired',
      edit: 'Edit details',
      owner: 'Owner:',
      monthTitle: 'Work in',
      month: 'Month',
      monthLoading: "Loading the month's trips...",
      loadFailed: "Could not load this month's figures. Please try again.",
      unopenedTitle: 'Working days nobody opened',
      unopenedHint:
        'Nobody opened the daily operations page on these days, so they have no recorded trips and are not counted. Open each of them to add its trips:',
      separator: ', ',
      done: 'Full trips made',
      extra: 'Extra trips',
      extraDetail: 'Outside the usual routes',
      revenue: 'Revenue of the trips',
      unpriced: 'trips without a price',
      expenses: 'Expenses',
      profit: 'Profit',
      loss: 'Loss',
      countedHint:
        'Trips and profit are counted as in the reports: only done trips, and the expenses recorded on this vehicle. An outbound and a return trip together are one full trip, and one direction alone is half a trip.',
      rentTitle: "This month's rent for the owner",
      rentHint:
        "The suggested rent from the vehicle's rent terms for this month and the trips it made. Record it on the expenses page as vehicle rent.",
      contractorHint:
        "The suggested pay from the contractor's terms for this month and the trips the vehicle made. Record it on the expenses page as a contractor payment.",
      monthlyRent: 'Monthly rent',
      tripsRent: 'Trip rent',
      recorded: 'Recorded in expenses',
      remaining: 'Still due',
      rentLink: 'Record the rent on the expenses page',
      expensesTitle: "This month's expenses",
      expensesHint: 'Every expense recorded on this vehicle this month.',
      noExpenses: 'No expense was recorded on this vehicle this month.',
      expensesTotal: 'Total',
      expensesLink: 'Open the expenses page',
      detailsTitle: 'Vehicle details',
      notSet: 'Not recorded',
      ownerPhone: "Owner's phone",
      outboundRent: 'Outbound trip amount',
      returnRent: 'Return trip amount',
      notes: 'Notes',
      routesTitle: 'Current routes',
      routesHint: 'The active routes this vehicle runs now.',
      noRoutes: 'This vehicle runs no active route now.',
      tripsTitle: "This month's trips",
      tripsHint: 'Every trip this vehicle made or was planned to make this month.',
      noTrips: 'This vehicle has no trips this month.',
      day: 'Day',
      trip: 'Trip',
      driver: 'Driver',
      state: 'Status',
      reason: 'Reason and notes',
      extraTag: 'Extra',
      noRoute: 'Trip without a route',
    },
    list: {
      title: 'Vehicles',
      add: 'Add vehicle',
      hint: 'The buses, microbuses, and cars you use to transport staff, whether you own them, rent them, or a contractor brings them. Choose a plate number to see the vehicle page and its trips each month.',
      loading: 'Loading...',
      empty: 'You have not added any vehicle yet. Start by adding the first one.',
      open: 'Vehicle page',
      filter: 'Show by ownership',
      allOwnerships: 'All vehicles',
      noMatch: 'There are no vehicles of this kind.',
      plateNumber: 'Plate number',
      type: 'Type',
      ownership: 'Ownership',
      model: 'Model',
      year: 'Year',
      seats: 'Seats',
      licenseExpiry: 'License expiry',
      expired: 'Expired',
      service: 'Status',
      inService: 'In service',
      outOfService: 'Out of service',
      edit: 'Edit',
    },
    form: {
      addTitle: 'Add a new vehicle',
      editTitle: 'Edit vehicle details',
      plateNumber: 'Plate number',
      plateNumberHint: 'Write it exactly as it appears on the plate.',
      type: 'Vehicle type',
      chooseType: 'Choose a type',
      model: 'Make and model',
      modelHint: 'e.g. Toyota Hiace.',
      year: 'Manufacture year',
      seats: 'Number of seats',
      seatsHint: 'How many passengers the vehicle carries.',
      licenseExpiry: 'License expiry date',
      licenseExpiryHint: 'The list shows "Expired" after this date.',
      ownership: 'Vehicle ownership',
      ownershipHint: 'Rented: a vehicle you rent from its owner or an office. Contractor vehicle: someone who works with you using their own vehicle.',
      ownerName: "Owner's or office's name",
      ownerNameHint: 'The person you settle with for this vehicle.',
      ownerPhone: 'Their mobile number',
      rentType: 'How is the owner paid?',
      rentTypeHint: 'The expenses page suggests this pay every month, and it shows in each route\'s account. A change here applies from the current month; past months keep their old terms.',
      monthlyRent: 'Monthly rent',
      amountHint: 'Digits only, like 12000 or 12000.50',
      tripRentHint: 'Each trip the vehicle makes earns its direction\'s amount; outbound and return may differ.',
      outboundRent: 'Outbound trip amount',
      returnRent: 'Return trip amount',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this vehicle.',
      active: 'This vehicle is in service',
      activeHint: 'An inactive vehicle is not offered for routes or trips, and its past trips and expenses stay as they are.',
      add: 'Add vehicle',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The vehicle was added.',
      saved: 'Your changes were saved.',
    },
  },
};
