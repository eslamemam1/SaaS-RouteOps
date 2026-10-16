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
    readonly current: string;
    readonly change: string;
    readonly close: string;
    readonly modes: Record<TripRecording, string>;
    readonly modeHints: Record<TripRecording, string>;
    readonly pastDay: Record<TripRecording, string>;
  };
  readonly conflict: Record<ConflictKind, string> & {
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
    readonly isToday: string;
    readonly holiday: string;
    readonly loading: string;
    readonly empty: string;
    readonly emptyAction: string;
    readonly trip: string;
    readonly crew: string;
    readonly status: string;
    readonly details: string;
    readonly notSet: string;
    readonly change: string;
    readonly markDone: string;
    readonly undoDone: string;
    readonly addExtra: string;
    readonly addRoutes: string;
    readonly fillDay: string;
    readonly extra: string;
    readonly noRoute: string;
    readonly remove: string;
    readonly confirmRemove: string;
    readonly omittedTitle: string;
    readonly omittedHint: string;
    readonly restore: string;
    readonly markAllDone: string;
    readonly notices: {
      readonly changed: string;
      readonly added: string;
      readonly removed: string;
      readonly restored: string;
      readonly allDone: string;
      readonly holiday: string;
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
    readonly outcome: string;
    readonly running: string;
    readonly runningHint: string;
    readonly cancelled: string;
    readonly cancelledHint: string;
    readonly reason: string;
    readonly reasonHint: string;
    readonly absentHint: string;
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
    readonly running: string;
    readonly submit: string;
    readonly willCancel: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly pastRoutes: {
    readonly title: string;
    readonly hint: string;
    readonly days: string;
    readonly from: string;
    readonly to: string;
    readonly thisDay: string;
    readonly monthSoFar: string;
    readonly dayCount: string;
    readonly routes: string;
    readonly routesHint: string;
    readonly selectAll: string;
    readonly clearAll: string;
    readonly inactive: string;
    readonly noRoutes: string;
    readonly submit: string;
    readonly cancel: string;
    readonly added: string;
    readonly none: string;
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
      routes: 'اختر خطًا واحدًا على الأقل.',
      pastDays:
        'اختر أيامًا مضت فقط، على أن يكون اليوم الأول قبل اليوم الأخير أو هو نفسه.',
      tooManyDays: 'اختر 93 يومًا على الأكثر في المرة الواحدة.',
      noTrip: 'لا يمكن استعادة هذه الرحلة لأن الخط لم يعد يشغّل هذا الاتجاه.',
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
      current: 'طريقة التسجيل:',
      change: 'تغيير الطريقة',
      close: 'إغلاق',
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
      filter: 'تعارض في المواعيد',
      formHint: 'تنبيه: يفصل بين هذه الرحلة والرحلات التالية أقل من ساعة. يمكنك الحفظ رغم ذلك.',
    },
    day: {
      title: 'التشغيل اليومي',
      hint: 'رحلات كل يوم كما حدثت فعلًا. فتح أي يوم هنا يُجهّز رحلاته من الخطوط فتُحسب في التقارير. التغيير هنا ليوم واحد فقط ولا يغيّر الخط.',
      date: 'الانتقال إلى يوم',
      previous: 'اليوم السابق',
      next: 'اليوم التالي',
      today: 'العودة إلى اليوم',
      isToday: 'اليوم',
      holiday: 'تسجيل إجازة',
      loading: 'جارٍ تجهيز رحلات اليوم...',
      empty: 'لا توجد رحلات في هذا اليوم. تظهر هنا رحلات الخطوط التي تعمل في هذا اليوم من الأسبوع، ويمكنك إضافة رحلة إضافية.',
      emptyAction: 'الذهاب إلى الخطوط',
      trip: 'الرحلة',
      crew: 'السائق والمركبة',
      status: 'الحالة',
      details: 'السبب والملاحظات',
      notSet: 'لم يُحدد',
      change: 'تغيير',
      markDone: 'تمّت',
      undoDone: 'التراجع عن "تمّت"',
      addExtra: 'إضافة رحلة إضافية',
      addRoutes: 'إضافة خطوط لأيام سابقة',
      fillDay: 'إضافة خطوط لهذا اليوم',
      extra: 'رحلة إضافية',
      noRoute: 'بدون خط',
      remove: 'حذف',
      confirmRemove: 'تأكيد',
      omittedTitle: 'رحلات حُذفت من هذا اليوم',
      omittedHint: 'حُذفت بالخطأ أو لم يكن يُفترض تسجيلها. يمكنك إعادة أي منها من الخط.',
      restore: 'استعادة',
      markAllDone: 'تسجيل كل الرحلات الظاهرة «تمّت»',
      notices: {
        changed: 'تم حفظ تغيير الرحلة.',
        added: 'تمت إضافة الرحلة.',
        removed: 'تم حذف الرحلة.',
        restored: 'تم استعادة الرحلة.',
        allDone: 'تم تسجيل الرحلات «تمّت».',
        holiday: 'تم إلغاء رحلات الإجازة.',
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
      tripPriceRouteHint:
        'اتركه فارغًا لتُحسب بسعر رحلة من الخط المختار: نصف سعر الوردية إذا كان الخط ذهابًا وعودة.',
      notes: 'ملاحظات',
      save: 'إضافة الرحلة',
      cancel: 'إلغاء',
    },
    filter: {
      customer: 'الشركة المتعاقدة',
      allCustomers: 'كل الشركات',
      direction: 'الاتجاه',
      allDirections: 'الذهاب والعودة',
      status: 'عرض حسب الحالة',
      allStatuses: 'كل الرحلات',
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
      outcome: 'ماذا حدث في هذه الرحلة؟',
      running: 'الرحلة قائمة',
      runningHint: 'غيّر السائق أو المركبة لهذا اليوم فقط إن تغيّر أحدهما.',
      cancelled: 'الرحلة ملغاة',
      cancelledHint: 'لا تُحسب ضمن الرحلات المنفّذة ولا في الإيراد.',
      reason: 'السبب',
      reasonHint: 'لماذا تغيّرت الرحلة أو أُلغيت؟',
      absentHint: 'اختيار «غياب السائق» يُخصم من أجر السائق المخطط للرحلة إذا كان موظفًا يغطي راتبه عددًا محددًا من الرحلات. الأسباب الأخرى لا تُخصم من أجر أحد.',
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
      running: 'الرحلات القائمة في هذا اليوم:',
      submit: 'إلغاء رحلاتها في هذا اليوم',
      willCancel: 'عدد الرحلات التي ستُلغى:',
      confirm: 'اضغط مرة أخرى لتأكيد الإلغاء',
      cancel: 'رجوع',
    },
    pastRoutes: {
      title: 'إضافة خطوط لأيام سابقة',
      hint: 'لرحلات تمّت قبل تسجيل خطوطها هنا. تُضاف رحلات كل خط في الأيام التي يعمل فيها من الأسبوع، بسائقه ومركبته وسعره الحاليين. الرحلات الموجودة في هذه الأيام لا تتغير، ويمكنك تعديل أي يوم بعد ذلك.',
      days: 'الأيام',
      from: 'من يوم',
      to: 'إلى يوم',
      thisDay: 'هذا اليوم فقط',
      monthSoFar: 'من أول الشهر حتى أمس',
      dayCount: 'عدد الأيام:',
      routes: 'الخطوط',
      routesHint: 'اختر الخطوط التي كانت تعمل في هذه الأيام.',
      selectAll: 'تحديد الكل',
      clearAll: 'إلغاء التحديد',
      inactive: 'متوقف',
      noRoutes: 'لا توجد خطوط بعد. أضف الخطوط أولًا من صفحة الخطوط.',
      submit: 'إضافة الرحلات',
      cancel: 'إلغاء',
      added: 'عدد الرحلات التي أُضيفت:',
      none: 'لم تُضف رحلات جديدة: الخطوط المختارة لا تعمل في هذه الأيام، أو رحلاتها موجودة بالفعل.',
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
      routes: 'Choose at least one route.',
      pastDays:
        'Choose days that have passed only, with the first day on or before the last.',
      tooManyDays: 'Choose 93 days at most at a time.',
      noTrip: 'This trip cannot be restored because the route no longer runs this direction.',
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
      current: 'Recording:',
      change: 'Change how',
      close: 'Close',
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
      filter: 'Time conflicts',
      formHint: 'Warning: these trips leave less than an hour from this one. You can still save.',
    },
    day: {
      title: 'Daily operations',
      hint: 'Each day\'s trips as they actually happened. Opening a day here prepares its trips from the routes so they count in the reports. Changes here are for one day only and do not change the route.',
      date: 'Go to a day',
      previous: 'Previous day',
      next: 'Next day',
      today: 'Back to today',
      isToday: 'Today',
      holiday: 'Record a holiday',
      loading: "Preparing the day's trips...",
      empty: 'There are no trips on this day. Trips of routes that run on this weekday appear here, and you can add an extra trip.',
      emptyAction: 'Go to routes',
      trip: 'Trip',
      crew: 'Driver and vehicle',
      status: 'Status',
      details: 'Reason and notes',
      notSet: 'Not set',
      change: 'Change',
      markDone: 'Done',
      undoDone: 'Undo "Done"',
      addExtra: 'Add an extra trip',
      addRoutes: 'Add routes to past days',
      fillDay: 'Add routes to this day',
      extra: 'Extra trip',
      noRoute: 'No route',
      remove: 'Delete',
      confirmRemove: 'Confirm',
      omittedTitle: 'Trips removed from this day',
      omittedHint: 'Deleted by mistake or not meant to count. You can put any of them back from the route.',
      restore: 'Restore',
      markAllDone: 'Mark all shown trips "Done"',
      notices: {
        changed: 'The trip change was saved.',
        added: 'The trip was added.',
        removed: 'The trip was deleted.',
        restored: 'The trip was restored.',
        allDone: 'The trips were marked "Done".',
        holiday: 'The holiday trips were cancelled.',
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
      tripPriceRouteHint:
        "Leave it empty to count it at one trip of the chosen route: half the shift price when the route runs out and back.",
      notes: 'Notes',
      save: 'Add trip',
      cancel: 'Cancel',
    },
    filter: {
      customer: 'Client company',
      allCustomers: 'All companies',
      direction: 'Direction',
      allDirections: 'Outbound and return',
      status: 'Show by status',
      allStatuses: 'All trips',
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
      outcome: 'What happened to this trip?',
      running: 'The trip runs',
      runningHint: 'Change the driver or vehicle for this day only, if either changed.',
      cancelled: 'The trip is cancelled',
      cancelledHint: 'It does not count as a done trip or as revenue.',
      reason: 'Reason',
      reasonHint: 'Why did the trip change or get cancelled?',
      absentHint: '"Driver absent" is taken off the planned driver\'s pay when the driver is an employee whose salary covers a set number of trips. No other reason costs anyone pay.',
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
      running: 'Running trips on this day:',
      submit: 'Cancel their trips on this day',
      willCancel: 'Trips to be cancelled:',
      confirm: 'Press again to confirm',
      cancel: 'Back',
    },
    pastRoutes: {
      title: 'Add routes to past days',
      hint: 'For trips that ran before their routes were set up here. Each route gets its trips on the weekdays it runs, with its current driver, vehicle, and price. Trips already on these days stay as they are, and you can change any day afterwards.',
      days: 'Days',
      from: 'From',
      to: 'To',
      thisDay: 'This day only',
      monthSoFar: 'From the 1st of the month to yesterday',
      dayCount: 'Days:',
      routes: 'Routes',
      routesHint: 'Choose the routes that ran on these days.',
      selectAll: 'Select all',
      clearAll: 'Clear',
      inactive: 'Stopped',
      noRoutes: 'There are no routes yet. Add routes first on the Routes page.',
      submit: 'Add trips',
      cancel: 'Cancel',
      added: 'Trips added:',
      none: 'No new trips were added: the chosen routes do not run on these days, or their trips are already there.',
    },
  },
};
