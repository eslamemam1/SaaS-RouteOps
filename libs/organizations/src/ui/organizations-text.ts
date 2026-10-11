import { Language } from '@routeops/shared/i18n';
import { Currency } from '@routeops/shared/money';
import { CompanyAccountProblem } from '../domain/company-account';
import { SubscriptionPaymentProblem } from '../domain/subscription-payment';

export interface OrganizationsText {
  readonly problems: Record<CompanyAccountProblem, string>;
  readonly currencies: Record<Currency, string>;
  readonly signIn: {
    readonly title: string;
    readonly hint: string;
    readonly email: string;
    readonly password: string;
    readonly submit: string;
    readonly headline: string;
    readonly headlineHighlight: string;
    readonly welcome: string;
    readonly points: readonly string[];
    readonly noAccount: string;
    readonly contactLink: string;
  };
  readonly home: {
    readonly title: string;
    readonly hint: string;
    readonly loading: string;
    readonly noCompany: string;
    readonly chooseTitle: string;
    readonly chooseHint: string;
    readonly welcome: string;
    readonly customers: string;
    readonly customersHint: string;
    readonly vehicles: string;
    readonly vehiclesHint: string;
    readonly drivers: string;
    readonly driversHint: string;
    readonly routes: string;
    readonly routesHint: string;
    readonly operations: string;
    readonly operationsHint: string;
    readonly expenses: string;
    readonly expensesHint: string;
    readonly reports: string;
    readonly reportsHint: string;
    readonly suspendedTitle: string;
    readonly suspended: string;
    readonly sectionsTitle: string;
  };
  readonly dashboard: {
    readonly todayTitle: string;
    readonly openToday: string;
    readonly planned: string;
    readonly done: string;
    readonly cancelled: string;
    readonly unopenedTitle: string;
    readonly unopened: string;
    readonly noTrips: string;
    readonly monthTitle: string;
    readonly monthHint: string;
    readonly openReports: string;
    readonly monthDone: string;
    readonly revenue: string;
    readonly expenses: string;
    readonly profit: string;
    readonly loss: string;
    readonly attentionTitle: string;
    readonly attentionHint: string;
    readonly allClear: string;
    readonly unopenedDays: string;
    readonly unopenedDaysHint: string;
    readonly driverPay: string;
    readonly driverPayHint: string;
    readonly vehiclePay: string;
    readonly vehiclePayHint: string;
    readonly unpriced: string;
    readonly unpricedHint: string;
    readonly loading: string;
    readonly retry: string;
  };
  readonly accounts: {
    readonly title: string;
    readonly hint: string;
    readonly status: string;
    readonly active: string;
    readonly inactive: string;
    readonly activate: string;
    readonly deactivate: string;
    readonly activated: string;
    readonly deactivated: string;
    readonly loading: string;
    readonly empty: string;
    readonly retry: string;
    readonly company: string;
    readonly logins: string;
    readonly currency: string;
    readonly createdAt: string;
    readonly lastSignIn: string;
    readonly noLogin: string;
    readonly neverSignedIn: string;
    readonly changePassword: string;
  };
  readonly password: {
    readonly title: string;
    readonly hint: string;
    readonly login: string;
    readonly password: string;
    readonly passwordHint: string;
    readonly submit: string;
    readonly cancel: string;
    readonly changed: string;
  };
  readonly payments: {
    readonly title: string;
    readonly hint: string;
    readonly add: string;
    readonly month: string;
    readonly previous: string;
    readonly next: string;
    readonly thisMonth: string;
    readonly monthTotal: string;
    readonly monthCount: string;
    readonly noMonthPayments: string;
    readonly company: string;
    readonly chooseCompany: string;
    readonly paidOn: string;
    readonly coversMonth: string;
    readonly coversMonthHint: string;
    readonly amount: string;
    readonly amountHint: string;
    readonly note: string;
    readonly noteHint: string;
    readonly remove: string;
    readonly confirmRemove: string;
    readonly recorded: string;
    readonly removed: string;
    readonly companiesTitle: string;
    readonly companiesHint: string;
    readonly total: string;
    readonly count: string;
    readonly lastPaidOn: string;
    readonly lastMonth: string;
    readonly loading: string;
    readonly empty: string;
    readonly noCompanies: string;
    readonly retry: string;
    readonly formTitle: string;
    readonly submit: string;
    readonly cancel: string;
    readonly problems: Record<SubscriptionPaymentProblem, string>;
  };
  readonly signOut: {
    readonly busy: string;
    readonly retry: string;
    readonly backHome: string;
  };
  readonly provision: {
    readonly title: string;
    readonly hint: string;
    readonly name: string;
    readonly email: string;
    readonly password: string;
    readonly passwordHint: string;
    readonly currency: string;
    readonly currencyHint: string;
    readonly submit: string;
    readonly created: string;
  };
}

export const organizationsText: Record<Language, OrganizationsText> = {
  ar: {
    problems: {
      organizationName: 'أدخل اسم الشركة.',
      organizationNameLength: 'اسم الشركة أطول من المسموح.',
      email: 'أدخل البريد الإلكتروني.',
      emailFormat: 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@company.com',
      password: 'يجب ألا تقل كلمة المرور عن 6 أحرف.',
      currency: 'اختر عملة الشركة.',
      emailTaken: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
      operatorOnly: 'إنشاء الشركات متاح لمدير الموقع فقط.',
      signIn: 'تعذّر تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.',
      signOut: 'تعذّر تسجيل الخروج. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
      accountStatus: 'تعذّر تغيير حالة الحساب. حاول مرة أخرى.',
      load: 'تعذّر تحميل بيانات الشركة. حاول مرة أخرى.',
      create: 'تعذّر إنشاء الشركة. حاول مرة أخرى.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
      login: 'لا يمكن تغيير كلمة مرور هذا الحساب من هنا.',
      passwordChange: 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.',
    },
    currencies: {
      EGP: 'جنيه مصري',
      SAR: 'ريال سعودي',
      AED: 'درهم إماراتي',
      QAR: 'ريال قطري',
      KWD: 'دينار كويتي',
      BHD: 'دينار بحريني',
      OMR: 'ريال عماني',
      JOD: 'دينار أردني',
    },
    signIn: {
      title: 'تسجيل الدخول',
      hint: 'أدخل البريد الإلكتروني وكلمة المرور التي أرسلها لك مدير الموقع.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      submit: 'دخول',
      headline: 'كل عمل شركتك',
      headlineHighlight: 'في شاشة واحدة',
      welcome: 'مرحبًا بعودتك. ادخل لمتابعة عمل شركتك.',
      points: [
        'رحلات اليوم وما تغيّر فيها',
        'رواتب السائقين وأجرة المركبات',
        'الإيراد والمصاريف وربح كل خط',
      ],
      noAccount: 'ليس لديك حساب؟ نجهّز حساب كل شركة بأنفسنا.',
      contactLink: 'تواصل معنا',
    },
    home: {
      title: 'الرئيسية',
      hint: 'اختر القسم الذي تريد العمل عليه.',
      loading: 'جارٍ التحميل...',
      noCompany: 'هذا الحساب غير مرتبط بأي شركة نقل. تواصل مع مدير الموقع.',
      chooseTitle: 'اختر شركتك',
      chooseHint: 'حسابك مرتبط بأكثر من شركة. اختر الشركة التي تريد العمل عليها.',
      welcome: 'مرحبًا،',
      customers: 'الشركات المتعاقدة',
      customersHint: 'الشركات والمصانع التي تنقل موظفيها.',
      vehicles: 'المركبات',
      vehiclesHint: 'الأتوبيسات والميكروباصات والسيارات التي تنقل بها الموظفين.',
      drivers: 'السائقون',
      driversHint: 'السائقون الذين يعملون معك في نقل الموظفين.',
      routes: 'الخطوط',
      routesHint: 'اربط كل شركة متعاقدة بمركبة وسائق ومواعيد.',
      operations: 'التشغيل اليومي',
      operationsHint: 'رحلات كل يوم: غياب سائق، عطل مركبة، أو إجازة.',
      expenses: 'المصاريف',
      expensesHint: 'الوقود والصيانة والرواتب وإيجار المركبات وكل ما تصرفه الشركة.',
      reports: 'التقارير',
      reportsHint: 'الرحلات التي تمّت كل شهر وإيرادها ومصاريفها وصافي الربح.',
      suspendedTitle: 'حساب الشركة موقوف',
      suspended:
        'أُوقف حساب شركتك مؤقتًا لحين سداد الاشتراك الشهري. بياناتك محفوظة ولن يُحذف منها شيء. تواصل مع مدير الموقع لإعادة تفعيل الحساب.',
      sectionsTitle: 'الأقسام',
    },
    dashboard: {
      todayTitle: 'رحلات اليوم',
      openToday: 'افتح التشغيل اليومي',
      planned: 'رحلات اليوم',
      done: 'تمّت',
      cancelled: 'ملغاة',
      unopenedTitle: 'لم يُفتح يوم اليوم بعد',
      unopened: 'افتح التشغيل اليومي لتظهر رحلات اليوم وتسجّل ما تغيّر فيها.',
      noTrips: 'لا توجد خطوط تعمل اليوم.',
      monthTitle: 'هذا الشهر',
      monthHint: 'بنفس حساب صفحة التقارير: الرحلات التي تمّت حتى اليوم ومصاريف الشهر المسجّلة.',
      openReports: 'افتح التقارير',
      monthDone: 'رحلات تمّت',
      revenue: 'الإيراد',
      expenses: 'المصاريف',
      profit: 'صافي الربح',
      loss: 'خسارة',
      attentionTitle: 'يحتاج انتباهك',
      attentionHint: 'أشياء لم تُسجّل بعد، فتنقص حسابات الشهر حتى تسجّلها.',
      allClear: 'كل شيء مسجّل. لا يوجد ما يحتاج انتباهك الآن.',
      unopenedDays: 'أيام عمل لم تُفتح هذا الشهر',
      unopenedDaysHint: 'رحلات هذه الأيام لم تُسجّل، فلا تدخل في التقارير.',
      driverPay: 'سائقون لم تُسجّل رواتبهم أو أجرهم',
      driverPayHint: 'سجّلها من المصاريف لتدخل في صافي الربح.',
      vehiclePay: 'مركبات لم تُسجّل أجرتها',
      vehiclePayHint: 'سجّل إيجار المركبات المؤجّرة ومركبات المقاولين من المصاريف.',
      unpriced: 'رحلات تمّت بلا سعر',
      unpricedHint: 'أضف سعر الرحلة للخط حتى يُحسب إيرادها.',
      loading: 'جارٍ تحميل أرقام اليوم والشهر...',
      retry: 'حاول مرة أخرى',
    },
    accounts: {
      title: 'حسابات الشركات',
      hint: 'كل شركات النقل التي لها حساب على الموقع. أوقف حساب الشركة إذا لم تدفع الاشتراك الشهري، وفعّله مرة أخرى بعد الدفع. الشركة الموقوفة لا تستطيع استخدام بياناتها، ولا يُحذف منها شيء.',
      status: 'الحالة',
      active: 'نشط',
      inactive: 'موقوف',
      activate: 'تفعيل الحساب',
      deactivate: 'إيقاف الحساب',
      activated: 'تم تفعيل حساب',
      deactivated: 'تم إيقاف حساب',
      loading: 'جارٍ تحميل حسابات الشركات...',
      empty: 'لا توجد شركات بعد. أنشئ أول حساب من النموذج أدناه.',
      retry: 'حاول مرة أخرى',
      company: 'شركة النقل',
      logins: 'البريد الإلكتروني للدخول',
      currency: 'العملة',
      createdAt: 'تاريخ الإنشاء',
      lastSignIn: 'آخر دخول',
      noLogin: 'لا يوجد حساب دخول',
      neverSignedIn: 'لم تدخل بعد',
      changePassword: 'تغيير كلمة المرور',
    },
    password: {
      title: 'كلمة مرور جديدة',
      hint: 'استخدمها إذا نسيت الشركة كلمة المرور. تحلّ الكلمة الجديدة محل القديمة فورًا، ثم أبلغ الشركة بها.',
      login: 'البريد الإلكتروني للدخول',
      password: 'كلمة المرور الجديدة',
      passwordHint: '6 أحرف أو أرقام على الأقل.',
      submit: 'حفظ كلمة المرور',
      cancel: 'إلغاء',
      changed: 'تم تغيير كلمة المرور. أبلغ الشركة بها لتدخل بها من الآن:',
    },
    payments: {
      title: 'مدفوعات الاشتراكات',
      hint: 'سجّل كل اشتراك تدفعه شركة بعد أن يصلك المبلغ، لتعرف ما دفعته كل شركة وما وصلك كل شهر. يُكتب كل مبلغ بعملة الشركة.',
      add: 'تسجيل دفعة',
      month: 'الشهر',
      previous: 'الشهر السابق',
      next: 'الشهر التالي',
      thisMonth: 'هذا الشهر',
      monthTotal: 'إجمالي ما وصلك عن هذا الشهر',
      monthCount: 'عدد الدفعات',
      noMonthPayments: 'لا توجد دفعات مسجّلة عن هذا الشهر.',
      company: 'شركة النقل',
      chooseCompany: 'اختر الشركة',
      paidOn: 'تاريخ الدفع',
      coversMonth: 'عن شهر',
      coversMonthHint: 'الشهر الذي يغطيه هذا الاشتراك.',
      amount: 'المبلغ',
      amountHint: 'بعملة الشركة، مثل 1500 أو 1500.50',
      note: 'ملاحظة',
      noteHint: 'مثل طريقة الدفع أو رقم التحويل.',
      remove: 'حذف',
      confirmRemove: 'اضغط مرة أخرى لتأكيد الحذف',
      recorded: 'تم تسجيل الدفعة.',
      removed: 'تم حذف الدفعة.',
      companiesTitle: 'ما دفعته كل شركة',
      companiesHint: 'كل ما سجّلته لكل شركة منذ البداية.',
      total: 'الإجمالي',
      count: 'عدد الدفعات',
      lastPaidOn: 'آخر دفعة',
      lastMonth: 'آخر شهر مدفوع',
      loading: 'جارٍ تحميل المدفوعات...',
      empty: 'لم تُسجّل أي دفعة بعد. سجّل أول دفعة عندما تدفع شركة اشتراكها.',
      noCompanies: 'أنشئ حساب شركة أولًا لتسجّل مدفوعاتها.',
      retry: 'حاول مرة أخرى',
      formTitle: 'تسجيل دفعة اشتراك',
      submit: 'تسجيل الدفعة',
      cancel: 'إلغاء',
      problems: {
        company: 'اختر الشركة التي دفعت.',
        paidOn: 'أدخل تاريخ الدفع.',
        coversMonth: 'اختر الشهر الذي يغطيه الاشتراك.',
        amount: 'أدخل مبلغًا أكبر من صفر بعملة الشركة.',
        noteLength: 'الملاحظة أطول من 500 حرف.',
        load: 'تعذّر تحميل المدفوعات. حاول مرة أخرى.',
        save: 'تعذّر تسجيل الدفعة. حاول مرة أخرى.',
        remove: 'تعذّر حذف الدفعة. حاول مرة أخرى.',
      },
    },
    signOut: {
      busy: 'جارٍ تسجيل الخروج...',
      retry: 'حاول مرة أخرى',
      backHome: 'العودة إلى الرئيسية',
    },
    provision: {
      title: 'إنشاء حساب لشركة نقل جديدة',
      hint: 'أدخل بيانات شركة النقل المشتركة معك. ستستخدم الشركة البريد الإلكتروني وكلمة المرور لتسجيل الدخول.',
      name: 'اسم شركة النقل',
      email: 'البريد الإلكتروني لتسجيل الدخول',
      password: 'كلمة المرور',
      passwordHint: '6 أحرف أو أرقام على الأقل.',
      currency: 'العملة',
      currencyHint: 'تُكتب بها كل الأسعار والإيرادات في حساب الشركة، ولا يمكن تغييرها لاحقًا.',
      submit: 'إنشاء الحساب',
      created:
        'تم إنشاء حساب الشركة. أرسل لها البريد الإلكتروني وكلمة المرور لتبدأ العمل.',
    },
  },
  en: {
    problems: {
      organizationName: 'Enter the company name.',
      organizationNameLength: 'The company name is too long.',
      email: 'Enter an email address.',
      emailFormat: 'Enter a valid email, like name@company.com',
      password: 'The password must be at least 6 characters.',
      currency: "Choose the company's currency.",
      emailTaken: 'An account with this email already exists.',
      operatorOnly: 'Only the site manager can create companies.',
      signIn: 'Could not sign in. Check the email and password.',
      signOut: 'Could not sign out. Check your internet connection and try again.',
      accountStatus: 'Could not change the account status. Please try again.',
      load: 'Could not load your company. Please try again.',
      create: 'Could not create the company. Please try again.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
      login: "This login's password cannot be changed from here.",
      passwordChange: 'Could not change the password. Please try again.',
    },
    currencies: {
      EGP: 'Egyptian pound',
      SAR: 'Saudi riyal',
      AED: 'UAE dirham',
      QAR: 'Qatari riyal',
      KWD: 'Kuwaiti dinar',
      BHD: 'Bahraini dinar',
      OMR: 'Omani rial',
      JOD: 'Jordanian dinar',
    },
    signIn: {
      title: 'Sign in',
      hint: 'Enter the email and password the site manager sent you.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      headline: "All your company's work",
      headlineHighlight: 'on one screen',
      welcome: 'Welcome back. Sign in to follow your company\'s work.',
      points: [
        'Today\'s trips and what changed',
        'Driver salaries and vehicle pay',
        'Revenue, expenses, and the profit of each route',
      ],
      noAccount: 'No account yet? We set up every company account ourselves.',
      contactLink: 'Contact us',
    },
    home: {
      title: 'Home',
      hint: 'Choose the section you want to work on.',
      loading: 'Loading...',
      noCompany:
        'This account is not linked to a transport company. Contact the site manager.',
      chooseTitle: 'Choose your company',
      chooseHint:
        'Your account is linked to more than one company. Choose the one you want to work on.',
      welcome: 'Welcome,',
      customers: 'Client companies',
      customersHint: 'The companies and factories whose staff you transport.',
      vehicles: 'Vehicles',
      vehiclesHint: 'The buses, microbuses, and cars you use to transport staff.',
      drivers: 'Drivers',
      driversHint: 'The drivers who work with you transporting staff.',
      routes: 'Routes',
      routesHint: 'Link each client company to a vehicle, a driver, and times.',
      operations: 'Daily operations',
      operationsHint: "Each day's trips: an absent driver, a broken vehicle, or a holiday.",
      expenses: 'Expenses',
      expensesHint: 'Fuel, maintenance, salaries, vehicle rent, and everything else the company spends.',
      reports: 'Reports',
      reportsHint: 'The trips done each month, their revenue, the expenses, and net profit.',
      suspendedTitle: 'The company account is stopped',
      suspended:
        'Your company account is stopped until the monthly subscription is paid. Your data is kept and nothing is deleted. Contact the site manager to turn the account back on.',
      sectionsTitle: 'Sections',
    },
    dashboard: {
      todayTitle: "Today's trips",
      openToday: 'Open daily operations',
      planned: "Today's trips",
      done: 'Done',
      cancelled: 'Cancelled',
      unopenedTitle: 'Today is not opened yet',
      unopened: "Open daily operations to see today's trips and record what changed.",
      noTrips: 'No route runs today.',
      monthTitle: 'This month',
      monthHint: "Counted like the reports page: the trips done so far and the month's recorded expenses.",
      openReports: 'Open reports',
      monthDone: 'Trips done',
      revenue: 'Revenue',
      expenses: 'Expenses',
      profit: 'Net profit',
      loss: 'Loss',
      attentionTitle: 'Needs your attention',
      attentionHint: "Things not recorded yet, so the month's figures stay short until you record them.",
      allClear: 'Everything is recorded. Nothing needs your attention now.',
      unopenedDays: 'Working days not opened this month',
      unopenedDaysHint: 'The trips of these days were not recorded, so reports leave them out.',
      driverPay: 'Drivers with salary or pay not recorded',
      driverPayHint: 'Record it in expenses so it counts in net profit.',
      vehiclePay: 'Vehicles with pay not recorded',
      vehiclePayHint: 'Record the rent of rented and contractor vehicles in expenses.',
      unpriced: 'Done trips with no price',
      unpricedHint: 'Add a trip price to the route so its revenue counts.',
      loading: "Loading today's and this month's figures...",
      retry: 'Try again',
    },
    accounts: {
      title: 'Company accounts',
      hint: "Every transport company with an account on the site. Stop a company's account if it has not paid the monthly subscription, and turn it back on after it pays. A stopped company cannot use its data, and nothing is deleted.",
      status: 'Status',
      active: 'Active',
      inactive: 'Stopped',
      activate: 'Turn on account',
      deactivate: 'Stop account',
      activated: 'Account turned on:',
      deactivated: 'Account stopped:',
      loading: 'Loading company accounts...',
      empty: 'There are no companies yet. Create the first account with the form below.',
      retry: 'Try again',
      company: 'Transport company',
      logins: 'Sign-in email',
      currency: 'Currency',
      createdAt: 'Created',
      lastSignIn: 'Last sign-in',
      noLogin: 'No sign-in account',
      neverSignedIn: 'Not signed in yet',
      changePassword: 'Change password',
    },
    password: {
      title: 'New password',
      hint: 'Use this when a company forgets its password. The new password replaces the old one at once; then tell the company.',
      login: 'Sign-in email',
      password: 'New password',
      passwordHint: 'At least 6 letters or numbers.',
      submit: 'Save password',
      cancel: 'Cancel',
      changed: 'The password was changed. Tell the company so it can sign in with it from now on:',
    },
    payments: {
      title: 'Subscription payments',
      hint: 'Record each subscription a company pays once the money reaches you, to know what each company paid and what came in each month. Every amount is in the company’s currency.',
      add: 'Record a payment',
      month: 'Month',
      previous: 'Previous month',
      next: 'Next month',
      thisMonth: 'This month',
      monthTotal: 'Received for this month',
      monthCount: 'Payments',
      noMonthPayments: 'No payments are recorded for this month.',
      company: 'Transport company',
      chooseCompany: 'Choose the company',
      paidOn: 'Paid on',
      coversMonth: 'For month',
      coversMonthHint: 'The month this subscription covers.',
      amount: 'Amount',
      amountHint: 'In the company’s currency, like 1500 or 1500.50',
      note: 'Note',
      noteHint: 'Such as how it was paid or the transfer number.',
      remove: 'Delete',
      confirmRemove: 'Press again to confirm',
      recorded: 'The payment was recorded.',
      removed: 'The payment was deleted.',
      companiesTitle: 'What each company paid',
      companiesHint: 'Everything you recorded for each company since the start.',
      total: 'Total',
      count: 'Payments',
      lastPaidOn: 'Last payment',
      lastMonth: 'Last month paid',
      loading: 'Loading payments...',
      empty: 'No payment is recorded yet. Record the first one when a company pays its subscription.',
      noCompanies: 'Create a company account first to record its payments.',
      retry: 'Try again',
      formTitle: 'Record a subscription payment',
      submit: 'Record payment',
      cancel: 'Cancel',
      problems: {
        company: 'Choose the company that paid.',
        paidOn: 'Enter the payment date.',
        coversMonth: 'Choose the month the subscription covers.',
        amount: 'Enter an amount above zero in the company’s currency.',
        noteLength: 'The note is longer than 500 characters.',
        load: 'Could not load the payments. Please try again.',
        save: 'Could not record the payment. Please try again.',
        remove: 'Could not delete the payment. Please try again.',
      },
    },
    signOut: {
      busy: 'Signing out...',
      retry: 'Try again',
      backHome: 'Back to home',
    },
    provision: {
      title: 'Create an account for a new transport company',
      hint: 'Enter the details of the transport company that subscribed with you. The company signs in with this email and password.',
      name: 'Transport company name',
      email: 'Sign-in email',
      password: 'Password',
      passwordHint: 'At least 6 letters or numbers.',
      currency: 'Currency',
      currencyHint: "All prices and revenue in the company's account use it. It cannot be changed later.",
      submit: 'Create account',
      created:
        'The company account was created. Send them the email and password so they can start.',
    },
  },
};
