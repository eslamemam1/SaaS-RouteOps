import { Language } from '@routeops/shared/i18n';
import { DriverProblem, PayType } from '../domain/driver';
import {
  ChangeReason,
  DriverTripState,
  TripDirection,
} from '../domain/driver-month';

export interface DriversText {
  readonly problems: Record<DriverProblem, string>;
  readonly payTypes: Record<PayType, string>;
  readonly directions: Record<TripDirection, string>;
  readonly states: Record<DriverTripState, string>;
  readonly reasons: Record<ChangeReason, string>;
  readonly page: {
    readonly back: string;
    readonly loading: string;
    readonly notFound: string;
    readonly licenseExpired: string;
    readonly edit: string;
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
    readonly absent: string;
    readonly absentDetail: string;
    readonly revenue: string;
    readonly unpriced: string;
    readonly countedHint: string;
    readonly payTitle: string;
    readonly payHint: string;
    readonly salary: string;
    readonly extraTrips: string;
    readonly tripsPay: string;
    readonly absence: string;
    readonly suggested: string;
    readonly recorded: string;
    readonly remaining: string;
    readonly payLink: string;
    readonly noPay: string;
    readonly detailsTitle: string;
    readonly notSet: string;
    readonly salaryTrips: string;
    readonly outboundPay: string;
    readonly returnPay: string;
    readonly notes: string;
    readonly routesTitle: string;
    readonly routesHint: string;
    readonly noRoutes: string;
    readonly noVehicle: string;
    readonly tripsTitle: string;
    readonly tripsHint: string;
    readonly noTrips: string;
    readonly day: string;
    readonly trip: string;
    readonly vehicle: string;
    readonly state: string;
    readonly reason: string;
    readonly extraTag: string;
    readonly drivenBy: string;
    readonly noRoute: string;
  };
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly open: string;
    readonly fullName: string;
    readonly phone: string;
    readonly nationalId: string;
    readonly licenseNumber: string;
    readonly licenseExpiry: string;
    readonly expired: string;
    readonly expiresSoon: string;
    readonly work: string;
    readonly working: string;
    readonly stopped: string;
    readonly edit: string;
    readonly remove: string;
    readonly confirmRemove: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly fullName: string;
    readonly fullNameHint: string;
    readonly phone: string;
    readonly nationalId: string;
    readonly nationalIdHint: string;
    readonly licenseNumber: string;
    readonly licenseExpiry: string;
    readonly licenseExpiryHint: string;
    readonly payTitle: string;
    readonly payHint: string;
    readonly payType: string;
    readonly monthlySalary: string;
    readonly amountHint: string;
    readonly salaryTrips: string;
    readonly salaryTripsHint: string;
    readonly extraPayHint: string;
    readonly extraTripsHint: string;
    readonly perTripHint: string;
    readonly outboundPay: string;
    readonly returnPay: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly photo: string;
    readonly optional: string;
    readonly photoHint: string;
    readonly choosePhoto: string;
    readonly changePhoto: string;
    readonly removePhoto: string;
    readonly active: string;
    readonly activeHint: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly added: string;
    readonly saved: string;
    readonly removed: string;
    readonly photoFailed: string;
  };
}

export const driversText: Record<Language, DriversText> = {
  ar: {
    problems: {
      name: 'أدخل اسم السائق.',
      tooLong: 'النص أطول من المسموح.',
      nationalId: 'الرقم القومي يحتوي على أرقام وحروف إنجليزية فقط.',
      nationalIdTaken: 'هذا الرقم القومي مسجّل بالفعل لسائق آخر.',
      date: 'أدخل تاريخًا صحيحًا.',
      amount: 'أدخل المبلغ بالأرقام فقط، مثل 5000 أو 5000.50',
      required: 'هذه الخانة مطلوبة.',
      trips: 'اكتب عدد الرحلات بالأرقام فقط، مثل 26.',
      photo: 'تعذّر فتح هذه الصورة. اختر صورة بصيغة JPG أو PNG أو WebP.',
      activeRoutes: 'لا يمكن إيقاف هذا السائق لأنه سائق هذه الخطوط العاملة. اختر لها سائقًا آخر أو أوقفها من صفحة الخطوط أولًا:',
      inUse: 'لا يمكن حذف هذا السائق لأنه مربوط بخطوط أو رحلات أو مصاريف. انقل الخطوط لسائق آخر أولًا، أو احذف ما يخصه:',
      load: 'تعذّر تحميل السائقين. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      remove: 'تعذّر حذف السائق. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    payTypes: {
      none: 'لم يُحدَّد بعد',
      salary: 'موظف براتب شهري',
      perTrip: 'يعمل بالرحلة',
    },
    directions: {
      outbound: 'ذهاب',
      return: 'عودة',
    },
    states: {
      done: 'تمّت',
      unrecorded: 'لم تُسجَّل بعد',
      planned: 'مخططة',
      cancelled: 'ملغاة',
      absent: 'غاب عنها',
      handedOver: 'قادها سائق آخر',
    },
    reasons: {
      holiday: 'إجازة',
      vehicleBreakdown: 'عطل في المركبة',
      driverAbsent: 'غياب السائق',
      customerRequest: 'طلب من الشركة المتعاقدة',
      other: 'أخرى',
    },
    page: {
      back: 'كل السائقين',
      loading: 'جارٍ تحميل صفحة السائق...',
      notFound: 'لم نجد هذا السائق. ربما فتحت رابطًا قديمًا.',
      licenseExpired: 'الرخصة منتهية',
      edit: 'تعديل البيانات',
      monthTitle: 'شغل شهر',
      month: 'الشهر',
      monthLoading: 'جارٍ تحميل رحلات الشهر...',
      loadFailed: 'تعذّر تحميل بيانات الشهر. حاول مرة أخرى.',
      unopenedTitle: 'أيام عمل لم تُفتح',
      unopenedHint:
        'لم يفتح أحد صفحة التشغيل اليومي في هذه الأيام، فلا توجد رحلات مسجّلة لها ولا تدخل في العدد. افتح كل يوم منها لتُضاف رحلاته:',
      separator: '، ',
      done: 'رحلات كاملة قادها',
      extra: 'رحلات إضافية',
      extraDetail: 'خارج الخطوط المعتادة',
      absent: 'رحلات غاب عنها',
      absentDetail: 'أُلغيت أو قادها غيره بسبب غيابه',
      revenue: 'إيراد رحلاته',
      unpriced: 'رحلة بلا سعر',
      countedHint:
        'تُحسب الرحلات بنفس طريقة التقارير: الرحلة المنفّذة فقط، ولا تُحسب الأيام التي لم تأتِ بعد. الذهاب والعودة معًا رحلة كاملة، والاتجاه الواحد منها نصف رحلة.',
      payTitle: 'أجر الشهر',
      payHint:
        'الأجر المقترح من الرحلات التي قادها فعلًا وشروط أجره في هذا الشهر. يُسجَّل الأجر من صفحة المصاريف، ويمكنك تعديل المبلغ قبل تسجيله.',
      salary: 'الراتب الشهري',
      extraTrips: 'رحلات فوق الراتب',
      tripsPay: 'أجر الرحلات',
      absence: 'خصم الغياب',
      suggested: 'الأجر المقترح',
      recorded: 'المسجّل في المصاريف',
      remaining: 'المتبقي',
      payLink: 'تسجيل الأجر من صفحة المصاريف',
      noPay:
        'لم تحدد طريقة حساب أجر هذا السائق، فلا يظهر أجر مقترح. اضغط "تعديل البيانات" لتحديدها.',
      detailsTitle: 'بيانات السائق',
      notSet: 'غير مسجّل',
      salaryTrips: 'رحلات يغطيها الراتب',
      outboundPay: 'مبلغ رحلة الذهاب',
      returnPay: 'مبلغ رحلة العودة',
      notes: 'ملاحظات',
      routesTitle: 'خطوطه الحالية',
      routesHint: 'الخطوط العاملة التي يقودها هذا السائق الآن.',
      noRoutes: 'لا يقود أي خط عامل حاليًا.',
      noVehicle: 'بدون مركبة',
      tripsTitle: 'رحلات الشهر',
      tripsHint:
        'كل رحلة قادها في هذا الشهر، والرحلات التي كانت له وقادها سائق آخر.',
      noTrips: 'لا توجد رحلات لهذا السائق في هذا الشهر.',
      day: 'اليوم',
      trip: 'الرحلة',
      vehicle: 'المركبة',
      state: 'الحالة',
      reason: 'السبب والملاحظات',
      extraTag: 'إضافية',
      drivenBy: 'قادها:',
      noRoute: 'رحلة بدون خط',
    },
    list: {
      title: 'السائقون',
      add: 'إضافة سائق',
      hint: 'السائقون الذين يعملون معك في نقل الموظفين. اضغط اسم السائق لترى صفحته ورحلاته في كل شهر.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي سائق بعد. ابدأ بإضافة أول سائق.',
      open: 'صفحة السائق',
      fullName: 'الاسم',
      phone: 'رقم الهاتف المحمول',
      nationalId: 'الرقم القومي',
      licenseNumber: 'رقم الرخصة',
      licenseExpiry: 'انتهاء الرخصة',
      expired: 'منتهية',
      expiresSoon: 'تنتهي قريبًا',
      work: 'الحالة',
      working: 'يعمل',
      stopped: 'لا يعمل حاليًا',
      edit: 'تعديل',
      remove: 'حذف',
      confirmRemove: 'تأكيد',
    },
    form: {
      addTitle: 'إضافة سائق جديد',
      editTitle: 'تعديل بيانات السائق',
      fullName: 'اسم السائق',
      fullNameHint: 'الاسم كما في البطاقة، مثل: أحمد محمد علي.',
      phone: 'رقم الهاتف المحمول',
      nationalId: 'الرقم القومي',
      nationalIdHint: 'الرقم المكتوب في بطاقة الهوية.',
      licenseNumber: 'رقم رخصة القيادة',
      licenseExpiry: 'تاريخ انتهاء رخصة القيادة',
      licenseExpiryHint:
        'تظهر في القائمة "تنتهي قريبًا" قبل هذا التاريخ بثلاثين يومًا، و"منتهية" بعده.',
      payTitle: 'أجر السائق',
      payHint:
        'يُستخدم لحساب راتب السائق المقترح كل شهر في صفحة المصاريف من الرحلات التي قادها فعلًا، ويمكنك تعديل المبلغ قبل تسجيله. أي تغيير هنا يسري من الشهر الحالي، وتبقى الشهور السابقة على حسابها القديم.',
      payType: 'طريقة حساب الأجر',
      monthlySalary: 'الراتب الشهري',
      amountHint: 'بالأرقام فقط، مثل 5000 أو 5000.50',
      salaryTrips: 'الراتب يغطي كم رحلة ذهاب وعودة في الشهر؟',
      salaryTripsHint:
        'مثال: 26 تعني 26 رحلة ذهاب و26 رحلة عودة. إذا قاد أكثر يأخذ عن كل رحلة إضافية، وإذا غاب يُخصم منه عن كل رحلة. اتركه فارغًا إذا كان راتبه ثابتًا، ويمكنك عندها تحديد مبلغ للرحلات الإضافية فقط.',
      extraPayHint:
        'المبلغ عن كل رحلة إضافية فوق العدد، ويُخصم المبلغ نفسه عن كل رحلة غاب عنها.',
      extraTripsHint:
        'راتبه ثابت. إذا حدّدت المبلغين، يأخذ فوق راتبه مبلغ الاتجاه عن كل رحلة إضافية يقودها، وهي الرحلات التي تضيفها بنفسك في التشغيل اليومي، ولا يُخصم منه شيء عن الغياب. اتركهما فارغين إن لم يأخذ عن الرحلات الإضافية شيئًا.',
      perTripHint: 'يأخذ مبلغًا عن كل رحلة يقودها.',
      outboundPay: 'مبلغ رحلة الذهاب',
      returnPay: 'مبلغ رحلة العودة',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذا السائق.',
      photo: 'صورة السائق',
      optional: '(اختياري)',
      photoHint:
        'تُصغَّر الصورة تلقائيًا قبل رفعها، فلا تشغل إلا مساحة صغيرة جدًا.',
      choosePhoto: 'اختيار صورة',
      changePhoto: 'تغيير الصورة',
      removePhoto: 'إزالة الصورة',
      active: 'السائق يعمل حاليًا',
      activeHint: 'لا يظهر السائق الموقوف عند اختيار سائق لخط أو رحلة، وتبقى رحلاته ورواتبه السابقة كما هي.',
      add: 'إضافة السائق',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة السائق.',
      saved: 'تم حفظ التعديلات.',
      removed: 'تم حذف السائق.',
      photoFailed:
        'تم حفظ بيانات السائق، لكن تعذّر رفع الصورة. افتح تعديل السائق وحاول مرة أخرى.',
    },
  },
  en: {
    problems: {
      name: 'Enter the driver name.',
      tooLong: 'This text is too long.',
      nationalId:
        'The national ID can contain only digits and English letters.',
      nationalIdTaken: 'This national ID is already used by another driver.',
      date: 'Enter a valid date.',
      amount: 'Enter the amount in digits only, like 5000 or 5000.50',
      required: 'This field is required.',
      trips: 'Enter the number of trips in digits only, like 26.',
      photo:
        'This photo could not be opened. Choose a JPG, PNG, or WebP photo.',
      activeRoutes: 'This driver cannot be made inactive because they drive these active routes. Give them another driver or stop them on the routes page first:',
      inUse: 'This driver cannot be deleted because routes, trips, or expenses still name them. Move the routes to another driver first, or clear what is linked:',
      load: 'Could not load your drivers. Please try again.',
      save: 'Could not save. Please try again.',
      remove: 'Could not delete the driver. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    payTypes: {
      none: 'Not set yet',
      salary: 'Employee with a monthly salary',
      perTrip: 'Paid per trip',
    },
    directions: {
      outbound: 'Outbound',
      return: 'Return',
    },
    states: {
      done: 'Done',
      unrecorded: 'Not recorded yet',
      planned: 'Planned',
      cancelled: 'Cancelled',
      absent: 'Absent',
      handedOver: 'Another driver drove it',
    },
    reasons: {
      holiday: 'Holiday',
      vehicleBreakdown: 'Vehicle breakdown',
      driverAbsent: 'Driver absent',
      customerRequest: 'Client company request',
      other: 'Other',
    },
    page: {
      back: 'All drivers',
      loading: 'Loading the driver page...',
      notFound: 'This driver was not found. The link may be old.',
      licenseExpired: 'License expired',
      edit: 'Edit details',
      monthTitle: 'Work in',
      month: 'Month',
      monthLoading: "Loading the month's trips...",
      loadFailed: "Could not load this month's figures. Please try again.",
      unopenedTitle: 'Working days nobody opened',
      unopenedHint:
        'Nobody opened the daily operations page on these days, so they have no recorded trips and are not counted. Open each of them to add its trips:',
      separator: ', ',
      done: 'Full trips driven',
      extra: 'Extra trips',
      extraDetail: 'Outside the usual routes',
      absent: 'Trips missed',
      absentDetail: 'Cancelled or driven by someone else because of absence',
      revenue: 'Revenue of the trips',
      unpriced: 'trips without a price',
      countedHint:
        'Trips are counted as in the reports: only done trips, and never days that have not come yet. An outbound and a return trip together are one full trip, and one direction alone is half a trip.',
      payTitle: "This month's pay",
      payHint:
        "The suggested pay from the trips the driver actually drove and the driver's pay terms for this month. Pay is recorded on the expenses page, where you can change the amount first.",
      salary: 'Monthly salary',
      extraTrips: 'Trips beyond the salary',
      tripsPay: 'Trip pay',
      absence: 'Absence deduction',
      suggested: 'Suggested pay',
      recorded: 'Recorded in expenses',
      remaining: 'Still due',
      payLink: 'Record the pay on the expenses page',
      noPay:
        'This driver has no pay terms, so no pay is suggested. Choose "Edit details" to set them.',
      detailsTitle: 'Driver details',
      notSet: 'Not recorded',
      salaryTrips: 'Trips the salary covers',
      outboundPay: 'Outbound trip amount',
      returnPay: 'Return trip amount',
      notes: 'Notes',
      routesTitle: 'Current routes',
      routesHint: 'The active routes this driver drives now.',
      noRoutes: 'This driver drives no active route now.',
      noVehicle: 'No vehicle',
      tripsTitle: "This month's trips",
      tripsHint:
        'Every trip the driver drove this month, and the trips planned for the driver that another driver drove.',
      noTrips: 'This driver has no trips this month.',
      day: 'Day',
      trip: 'Trip',
      vehicle: 'Vehicle',
      state: 'Status',
      reason: 'Reason and notes',
      extraTag: 'Extra',
      drivenBy: 'Driven by:',
      noRoute: 'Trip without a route',
    },
    list: {
      title: 'Drivers',
      add: 'Add driver',
      hint: "The drivers who work with you transporting staff. Choose a driver's name to see their page and their trips each month.",
      loading: 'Loading...',
      empty:
        'You have not added any driver yet. Start by adding the first one.',
      open: 'Driver page',
      fullName: 'Name',
      phone: 'Mobile',
      nationalId: 'National ID',
      licenseNumber: 'License number',
      licenseExpiry: 'License expiry',
      expired: 'Expired',
      expiresSoon: 'Expires soon',
      work: 'Status',
      working: 'Working',
      stopped: 'Stopped',
      edit: 'Edit',
      remove: 'Delete',
      confirmRemove: 'Confirm',
    },
    form: {
      addTitle: 'Add a new driver',
      editTitle: 'Edit driver details',
      fullName: 'Driver name',
      fullNameHint: 'The name as written on the ID card.',
      phone: 'Mobile number',
      nationalId: 'National ID',
      nationalIdHint: 'The number written on the ID card.',
      licenseNumber: 'Driving license number',
      licenseExpiry: 'Driving license expiry date',
      licenseExpiryHint:
        'The list shows "Expires soon" from 30 days before this date, and "Expired" after it.',
      payTitle: 'Driver pay',
      payHint:
        "Used to suggest the driver's salary each month on the expenses page from the trips the driver actually drove, and you can change the amount before recording it. A change here applies from the current month; past months keep their old terms.",
      payType: 'How is the driver paid?',
      monthlySalary: 'Monthly salary',
      amountHint: 'Digits only, like 5000 or 5000.50',
      salaryTrips:
        'How many outbound and return trips does the salary cover each month?',
      salaryTripsHint:
        'Example: 26 means 26 outbound and 26 return trips. Each trip beyond them earns extra, and each trip missed through absence is taken off. Leave it blank if the salary is fixed; you can then set an amount for extra trips only.',
      extraPayHint:
        'What each trip beyond that number earns; the same amount is taken off for each trip missed through absence.',
      extraTripsHint:
        'The salary is fixed. If you set both amounts, the driver also earns its direction\'s amount for each extra trip driven, the trips you add yourself on the daily screen, and nothing is taken off for absence. Leave both blank if extra trips earn nothing.',
      perTripHint: 'What the driver earns for each trip.',
      outboundPay: 'Outbound trip amount',
      returnPay: 'Return trip amount',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this driver.',
      photo: 'Driver photo',
      optional: '(optional)',
      photoHint:
        'The photo is shrunk automatically before upload, so it takes very little space.',
      choosePhoto: 'Choose a photo',
      changePhoto: 'Change photo',
      removePhoto: 'Remove photo',
      active: 'This driver is currently working',
      activeHint: 'An inactive driver is not offered for routes or trips, and their past trips and pay stay as they are.',
      add: 'Add driver',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The driver was added.',
      saved: 'Your changes were saved.',
      removed: 'The driver was deleted.',
      photoFailed:
        'The driver was saved, but the photo could not be uploaded. Open the driver and try again.',
    },
  },
};
