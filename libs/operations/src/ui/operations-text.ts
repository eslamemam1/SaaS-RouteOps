import { Language } from '@routeops/shared/i18n';
import {
  ChangeReason,
  ConflictKind,
  OperationsProblem,
  TripDirection,
  TripRecording,
  TripStatus,
  VehicleOwnership,
} from '../domain/daily-trip';

export interface OperationsText {
  readonly problems: Record<OperationsProblem, string>;
  readonly directions: Record<TripDirection, string>;
  readonly statuses: Record<TripStatus, string>;
  readonly ownerships: Record<VehicleOwnership, string>;
  readonly reasons: Record<ChangeReason, string>;
  readonly recording: {
    readonly title: string;
    readonly hint: string;
    readonly modes: Record<TripRecording, string>;
    readonly modeHints: Record<TripRecording, string>;
    readonly pastDay: Record<TripRecording, string>;
  };
  readonly conflict: Record<ConflictKind, string> & {
    readonly count: string;
    readonly filter: string;
    readonly formHint: string;
  };
  readonly day: {
    readonly title: string;
    readonly hint: string;
    readonly date: string;
    readonly previous: string;
    readonly next: string;
    readonly today: string;
    readonly loading: string;
    readonly empty: string;
    readonly emptyAction: string;
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
    readonly markDone: string;
    readonly undoDone: string;
    readonly addExtra: string;
    readonly extra: string;
    readonly noRoute: string;
    readonly remove: string;
    readonly confirmRemove: string;
    readonly markAllDone: string;
    readonly notices: {
      readonly changed: string;
      readonly added: string;
      readonly removed: string;
      readonly allDone: string;
    };
  };
  readonly extra: {
    readonly title: string;
    readonly hint: string;
    readonly route: string;
    readonly routeHint: string;
    readonly noRoute: string;
    readonly customer: string;
    readonly customerFromRoute: string;
    readonly chooseCustomer: string;
    readonly direction: string;
    readonly time: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly chooseDriver: string;
    readonly notSet: string;
    readonly tripPrice: string;
    readonly tripPriceHint: string;
    readonly tripPriceRouteHint: string;
    readonly notes: string;
    readonly save: string;
    readonly cancel: string;
  };
  readonly filter: {
    readonly customer: string;
    readonly allCustomers: string;
    readonly direction: string;
    readonly allDirections: string;
    readonly status: string;
    readonly allStatuses: string;
    readonly ownership: string;
    readonly allOwnerships: string;
    readonly search: string;
    readonly searchHint: string;
    readonly clear: string;
    readonly showing: string;
    readonly noMatch: string;
  };
  readonly change: {
    readonly title: string;
    readonly hint: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly chooseDriver: string;
    readonly notSet: string;
    readonly cancelled: string;
    readonly reason: string;
    readonly reasonHint: string;
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
    readonly willCancel: string;
    readonly confirm: string;
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
      customer: 'اختر الشركة المتعاقدة.',
      driver: 'اختر السائق.',
      time: 'اكتب ميعاد الرحلة.',
      tripPrice: 'أدخل السعر بالأرقام فقط، مثل 150 أو 150.50',
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
      unrecorded: 'لم تُسجَّل بعد',
    },
    ownerships: {
      owned: 'ملك الشركة',
      rented: 'إيجار',
      contractor: 'مركبة مقاول',
    },
    reasons: {
      holiday: 'إجازة',
      vehicleBreakdown: 'عطل في المركبة',
      driverAbsent: 'غياب السائق',
      customerRequest: 'طلب من الشركة المتعاقدة',
      other: 'أخرى',
    },
    recording: {
      title: 'طريقة تسجيل الرحلات',
      hint: 'يسري التغيير من اليوم وعلى كل من يستخدم حساب شركتك، ولا يغيّر حساب الأيام السابقة.',
      modes: {
        automatic: 'تلقائي',
        manual: 'يدوي',
      },
      modeHints: {
        automatic: 'كل رحلة تُحسب أنها تمّت عند حلول يومها، إلا إذا ألغيتها.',
        manual: 'لا تُحسب الرحلة أنها تمّت إلا بعد أن تضغط "تمّت" بجانبها.',
      },
      pastDay: {
        automatic: 'رحلات هذا اليوم تُحسب بالطريقة «تلقائي» التي كانت سارية فيه.',
        manual: 'رحلات هذا اليوم تُحسب بالطريقة «يدوي» التي كانت سارية فيه.',
      },
    },
    conflict: {
      vehicle: 'المركبة نفسها في رحلة أخرى الساعة',
      driver: 'السائق نفسه في رحلة أخرى الساعة',
      count: 'رحلات بها تعارض:',
      filter: 'الرحلات المتعارضة فقط',
      formHint: 'تنبيه: يفصل بين هذه الرحلة والرحلات التالية أقل من ساعة. يمكنك الحفظ رغم ذلك.',
    },
    day: {
      title: 'التشغيل اليومي',
      hint: 'رحلات كل يوم كما حدثت فعلًا. فتح أي يوم هنا يُجهّز رحلاته من الخطوط فتُحسب في التقارير. التغيير هنا ليوم واحد فقط ولا يغيّر الخط.',
      date: 'التاريخ',
      previous: 'اليوم السابق',
      next: 'اليوم التالي',
      today: 'العودة إلى اليوم',
      loading: 'جارٍ تجهيز رحلات اليوم...',
      empty: 'لا توجد رحلات في هذا اليوم. تظهر هنا رحلات الخطوط التي تعمل في هذا اليوم من الأسبوع، ويمكنك إضافة رحلة إضافية.',
      emptyAction: 'الذهاب إلى الخطوط',
      time: 'الميعاد',
      route: 'الخط',
      customer: 'الشركة المتعاقدة',
      direction: 'الاتجاه',
      vehicle: 'المركبة',
      driver: 'السائق',
      status: 'الحالة',
      reason: 'السبب',
      notSet: 'لم يُحدد',
      change: 'تغيير',
      markDone: 'تمّت',
      undoDone: 'التراجع عن "تمّت"',
      addExtra: 'إضافة رحلة إضافية',
      extra: 'رحلة إضافية',
      noRoute: 'بدون خط',
      remove: 'حذف',
      confirmRemove: 'تأكيد الحذف',
      markAllDone: 'تسجيل كل الرحلات الظاهرة «تمّت»',
      notices: {
        changed: 'تم حفظ تغيير الرحلة.',
        added: 'تمت إضافة الرحلة.',
        removed: 'تم حذف الرحلة.',
        allDone: 'تم تسجيل الرحلات «تمّت».',
      },
    },
    extra: {
      title: 'إضافة رحلة إضافية',
      hint: 'رحلة إضافية على رحلات الخطوط في هذا اليوم فقط، مثل رحلة مسائية أو رحلة لمرة واحدة. تُحسب مثل باقي الرحلات.',
      route: 'الخط',
      routeHint: 'عند اختيار خط تُملأ الشركة والمركبة والسائق منه، ويمكنك تغيير المركبة والسائق.',
      noRoute: 'بدون خط',
      customer: 'الشركة المتعاقدة',
      customerFromRoute: 'الشركة صاحبة الخط المختار.',
      chooseCustomer: 'اختر الشركة',
      direction: 'الاتجاه',
      time: 'الميعاد',
      vehicle: 'المركبة',
      driver: 'السائق',
      chooseDriver: 'اختر السائق',
      notSet: 'لم يُحدد',
      tripPrice: 'سعر الرحلة',
      tripPriceHint: 'المبلغ الذي تدفعه الشركة المتعاقدة عن هذه الرحلة. اتركه فارغًا إن لم يكن لها سعر.',
      tripPriceRouteHint: 'اتركه فارغًا لتُحسب الرحلة بسعر الخط المختار.',
      notes: 'ملاحظات',
      save: 'إضافة الرحلة',
      cancel: 'إلغاء',
    },
    filter: {
      customer: 'الشركة المتعاقدة',
      allCustomers: 'كل الشركات',
      direction: 'الاتجاه',
      allDirections: 'الذهاب والعودة',
      status: 'الحالة',
      allStatuses: 'كل الحالات',
      ownership: 'ملكية المركبة',
      allOwnerships: 'كل المركبات',
      search: 'بحث',
      searchHint: 'اسم الخط أو السائق أو رقم اللوحة',
      clear: 'إظهار كل الرحلات',
      showing: 'الرحلات الظاهرة:',
      noMatch: 'لا توجد رحلات تطابق اختيارك. غيّر البحث أو اضغط "إظهار كل الرحلات".',
    },
    change: {
      title: 'تغيير رحلة',
      hint: 'هذا التغيير لهذا اليوم فقط. لتغيير دائم، مثل سائق جديد بدل سائق ترك العمل، عدّل الخط من صفحة الخطوط.',
      vehicle: 'المركبة في هذا اليوم',
      driver: 'السائق في هذا اليوم',
      chooseDriver: 'اختر السائق',
      notSet: 'لم يُحدد',
      cancelled: 'أُلغيت هذه الرحلة',
      reason: 'السبب',
      reasonHint: 'اختيار «غياب السائق» يُخصم من أجر السائق المخطط للرحلة إذا كان موظفًا يغطي راتبه عددًا محددًا من الرحلات. الأسباب الأخرى لا تُخصم من أجر أحد.',
      chooseReason: 'اختر السبب',
      notes: 'ملاحظات',
      notesHint: 'مطلوبة إذا اخترت "أخرى".',
      save: 'حفظ التغيير',
      cancel: 'إلغاء',
    },
    holiday: {
      title: 'تسجيل إجازة',
      hint: 'اختر الشركات المتعاقدة التي لديها إجازة في هذا اليوم، وستُلغى رحلاتها بسبب "إجازة". الرحلات المسجّلة «تمّت» لا تتغير.',
      none: 'لا توجد رحلات قائمة لأي شركة في هذا اليوم.',
      submit: 'إلغاء رحلاتها في هذا اليوم',
      willCancel: 'عدد الرحلات التي ستُلغى:',
      confirm: 'اضغط مرة أخرى لتأكيد الإلغاء',
      done: 'تم إلغاء رحلات الإجازة.',
    },
  },
  en: {
    problems: {
      reason: 'Choose the reason for the change.',
      otherNotes: 'Write a note that explains the reason.',
      tooLong: 'This text is too long.',
      date: 'Choose a valid date.',
      customer: 'Choose the client company.',
      driver: 'Choose the driver.',
      time: 'Enter the trip time.',
      tripPrice: 'Enter the price in numbers only, like 150 or 150.50',
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
      unrecorded: 'Not recorded yet',
    },
    ownerships: {
      owned: 'Company owned',
      rented: 'Rented',
      contractor: 'Contractor vehicle',
    },
    reasons: {
      holiday: 'Holiday',
      vehicleBreakdown: 'Vehicle breakdown',
      driverAbsent: 'Driver absent',
      customerRequest: 'Client company request',
      other: 'Other',
    },
    recording: {
      title: 'How trips are recorded',
      hint: 'A change applies from today on, for everyone who uses your company account. Past days keep the way they were recorded.',
      modes: {
        automatic: 'Automatic',
        manual: 'Manual',
      },
      modeHints: {
        automatic: 'Each trip counts as done once its day comes, unless you cancel it.',
        manual: 'A trip counts as done only after you press "Done" next to it.',
      },
      pastDay: {
        automatic: 'Trips on this day count the "Automatic" way that applied then.',
        manual: 'Trips on this day count the "Manual" way that applied then.',
      },
    },
    conflict: {
      vehicle: 'Same vehicle on another trip at',
      driver: 'Same driver on another trip at',
      count: 'Trips with a conflict:',
      filter: 'Only trips with a conflict',
      formHint: 'Warning: these trips leave less than an hour from this one. You can still save.',
    },
    day: {
      title: 'Daily operations',
      hint: 'Each day\'s trips as they actually happened. Opening a day here prepares its trips from the routes so they count in the reports. Changes here are for one day only and do not change the route.',
      date: 'Date',
      previous: 'Previous day',
      next: 'Next day',
      today: 'Back to today',
      loading: "Preparing the day's trips...",
      empty: 'There are no trips on this day. Trips of routes that run on this weekday appear here, and you can add an extra trip.',
      emptyAction: 'Go to routes',
      time: 'Time',
      route: 'Route',
      customer: 'Client company',
      direction: 'Direction',
      vehicle: 'Vehicle',
      driver: 'Driver',
      status: 'Status',
      reason: 'Reason',
      notSet: 'Not set',
      change: 'Change',
      markDone: 'Done',
      undoDone: 'Undo "Done"',
      addExtra: 'Add an extra trip',
      extra: 'Extra trip',
      noRoute: 'No route',
      remove: 'Delete',
      confirmRemove: 'Confirm delete',
      markAllDone: 'Mark all shown trips "Done"',
      notices: {
        changed: 'The trip change was saved.',
        added: 'The trip was added.',
        removed: 'The trip was deleted.',
        allDone: 'The trips were marked "Done".',
      },
    },
    extra: {
      title: 'Add an extra trip',
      hint: 'A trip on top of the route trips, on this day only, such as an evening trip or a one-off run. It counts like any other trip.',
      route: 'Route',
      routeHint: 'Choosing a route fills in its company, vehicle, and driver. You can still change the vehicle and driver.',
      noRoute: 'No route',
      customer: 'Client company',
      customerFromRoute: 'The company of the chosen route.',
      chooseCustomer: 'Choose a company',
      direction: 'Direction',
      time: 'Time',
      vehicle: 'Vehicle',
      driver: 'Driver',
      chooseDriver: 'Choose a driver',
      notSet: 'Not set',
      tripPrice: 'Trip price',
      tripPriceHint: 'What the client company pays for this trip. Leave it empty if it has no price.',
      tripPriceRouteHint: "Leave it empty to count the trip at the chosen route's price.",
      notes: 'Notes',
      save: 'Add trip',
      cancel: 'Cancel',
    },
    filter: {
      customer: 'Client company',
      allCustomers: 'All companies',
      direction: 'Direction',
      allDirections: 'Outbound and return',
      status: 'Status',
      allStatuses: 'All statuses',
      ownership: 'Vehicle ownership',
      allOwnerships: 'All vehicles',
      search: 'Search',
      searchHint: 'Route, driver, or plate number',
      clear: 'Show all trips',
      showing: 'Trips shown:',
      noMatch: 'No trips match your choice. Change the search or press "Show all trips".',
    },
    change: {
      title: 'Change trip',
      hint: 'This change is for this day only. For a lasting change, such as a new driver replacing one who left, edit the route on the Routes page.',
      vehicle: 'Vehicle on this day',
      driver: 'Driver on this day',
      chooseDriver: 'Choose a driver',
      notSet: 'Not set',
      cancelled: 'This trip was cancelled',
      reason: 'Reason',
      reasonHint: '"Driver absent" is taken off the planned driver\'s pay when the driver is an employee whose salary covers a set number of trips. No other reason costs anyone pay.',
      chooseReason: 'Choose a reason',
      notes: 'Notes',
      notesHint: 'Required if you choose "Other".',
      save: 'Save change',
      cancel: 'Cancel',
    },
    holiday: {
      title: 'Record a holiday',
      hint: 'Choose the client companies that are on holiday this day, and their trips will be cancelled as "Holiday". Trips marked "Done" stay as they are.',
      none: 'No company has running trips on this day.',
      submit: 'Cancel their trips on this day',
      willCancel: 'Trips to be cancelled:',
      confirm: 'Press again to confirm',
      done: 'The holiday trips were cancelled.',
    },
  },
};
