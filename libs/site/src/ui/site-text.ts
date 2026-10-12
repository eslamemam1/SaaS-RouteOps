import { Language } from '@routeops/shared/i18n';
import { SubscriptionMonths } from '@routeops/shared/pricing';

export const featureKeys = [
  'customers',
  'operations',
  'fleet',
  'pay',
  'expenses',
  'reports',
] as const;

export type FeatureKey = (typeof featureKeys)[number];

export const promiseKeys = ['languages', 'devices', 'privacy'] as const;

export type PromiseKey = (typeof promiseKeys)[number];

export const previewStatuses = ['done', 'planned', 'cancelled'] as const;

export type PreviewStatus = (typeof previewStatuses)[number];

interface PreviewTrip {
  readonly route: string;
  readonly customer: string;
  readonly time: string;
  readonly status: PreviewStatus;
}

interface TitledText {
  readonly title: string;
  readonly text: string;
}

export interface SiteText {
  readonly home: {
    readonly eyebrow: string;
    readonly title: string;
    readonly titleHighlight: string;
    readonly lead: string;
    readonly contact: string;
    readonly signIn: string;
    readonly featuresTitle: string;
    readonly featuresHint: string;
    readonly features: Record<FeatureKey, TitledText>;
    readonly promises: Record<PromiseKey, string>;
    readonly stepsTitle: string;
    readonly stepsHint: string;
    readonly steps: readonly TitledText[];
    readonly ctaTitle: string;
    readonly ctaText: string;
    readonly whatsapp: string;
    readonly preview: {
      readonly window: string;
      readonly today: string;
      readonly planned: string;
      readonly done: string;
      readonly cancelled: string;
      readonly trips: readonly PreviewTrip[];
      readonly statuses: Record<PreviewStatus, string>;
      readonly swapTitle: string;
      readonly swapText: string;
      readonly profit: string;
    };
    readonly compareTitle: string;
    readonly compareHint: string;
    readonly before: { readonly title: string; readonly items: readonly string[] };
    readonly after: { readonly title: string; readonly items: readonly string[] };
    readonly faqTitle: string;
    readonly faqHint: string;
    readonly faq: readonly TitledText[];
  };
  readonly contact: {
    readonly title: string;
    readonly headline: string;
    readonly headlineHighlight: string;
    readonly hint: string;
    readonly phone: string;
    readonly phoneHint: string;
    readonly phoneAction: string;
    readonly whatsapp: string;
    readonly whatsappHint: string;
    readonly whatsappAction: string;
    readonly whatsappMessage: string;
    readonly email: string;
    readonly emailHint: string;
    readonly emailAction: string;
    readonly emailSubject: string;
    readonly hours: string;
    readonly hoursText: string;
    readonly address: string;
    readonly addressText: string;
    readonly accountTitle: string;
    readonly accountHint: string;
    readonly accountSteps: readonly string[];
    readonly signInHint: string;
    readonly signInText: string;
    readonly signIn: string;
  };
  readonly pricing: {
    readonly title: string;
    readonly headline: string;
    readonly headlineHighlight: string;
    readonly hint: string;
    readonly loading: string;
    readonly load: string;
    readonly empty: string;
    readonly period: string;
    readonly periods: Record<SubscriptionMonths, string>;
    readonly per: Record<SubscriptionMonths, string>;
    readonly save: string;
    readonly vehicles: string;
    readonly vehiclesHint: string;
    readonly currency: string;
    readonly upTo: string;
    readonly anySize: string;
    readonly agreed: string;
    readonly agreedHint: string;
    readonly instead: string;
    readonly fits: string;
    readonly tooMany: string;
    readonly choose: string;
    readonly contact: string;
    readonly included: readonly string[];
    readonly notesTitle: string;
    readonly notes: readonly string[];
  };
  readonly offers: {
    readonly label: string;
    readonly off: string;
    readonly trial: string;
    readonly days: {
      readonly one: string;
      readonly two: string;
      readonly few: string;
      readonly many: string;
    };
    readonly onPlans: string;
    readonly forPeriods: string;
    readonly or: string;
    readonly until: string;
    readonly see: string;
  };
}

export const siteText: Record<Language, SiteText> = {
  ar: {
    home: {
      eyebrow: 'نظام إدارة نقل الموظفين',
      title: 'نظّم نقل موظفي الشركات المتعاقدة معك',
      titleHighlight: 'من مكان واحد',
      lead: 'سجّل الشركات المتعاقدة وخطوطها، وتابع رحلات كل يوم، واحسب رواتب السائقين وأجرة المركبات، واعرف ربح كل خط في نهاية الشهر.',
      contact: 'اطلب حسابًا لشركتك',
      signIn: 'تسجيل الدخول',
      featuresTitle: 'كل ما تحتاجه شركة النقل',
      featuresHint: 'من تسجيل الخطوط إلى حساب الربح، بخطوات بسيطة يفهمها فريقك من أول يوم.',
      features: {
        customers: {
          title: 'الشركات المتعاقدة والخطوط',
          text: 'لكل شركة خطوطها ومواعيد الذهاب والعودة وسعر الرحلة، والسائق والمركبة على كل خط.',
        },
        operations: {
          title: 'التشغيل اليومي',
          text: 'رحلات كل يوم جاهزة من الخطوط. سجّل الإلغاء أو تغيير السائق أو المركبة مع السبب، وأضف الرحلات الإضافية.',
        },
        fleet: {
          title: 'السائقون والمركبات',
          text: 'بيانات كل سائق ومركبة وتواريخ انتهاء الرخص، والمركبات المملوكة والمؤجّرة ومركبات المقاولين.',
        },
        pay: {
          title: 'الرواتب والأجرة',
          text: 'يقترح النظام راتب كل سائق وأجرة كل مركبة من رحلاتهم الفعلية، وتعدّل المبلغ قبل تسجيله.',
        },
        expenses: {
          title: 'المصاريف',
          text: 'سجّل الوقود والصيانة والإيجار وكل مصروف، على مركبة أو سائق أو للشركة كلها.',
        },
        reports: {
          title: 'التقرير الشهري',
          text: 'الإيراد والمصاريف وصافي الربح، ونصيب السائق والمركبة والشركة من كل خط.',
        },
      },
      promises: {
        languages: 'بالعربية والإنجليزية',
        devices: 'يعمل على الكمبيوتر والموبايل',
        privacy: 'بيانات كل شركة منفصلة ومحمية',
      },
      stepsTitle: 'كيف تبدأ؟',
      stepsHint: 'لا تحتاج إلى إنشاء حساب بنفسك، فنحن نجهّزه لك.',
      steps: [
        { title: 'تواصل معنا', text: 'أخبرنا باسم شركتك وعدد مركباتك.' },
        { title: 'نجهّز حسابك', text: 'ننشئ حساب شركتك ونرسل لك بيانات الدخول.' },
        { title: 'ابدأ العمل', text: 'أضف الشركات المتعاقدة والخطوط، وتابع التشغيل من أول يوم.' },
      ],
      ctaTitle: 'جاهز تنظّم عمل شركتك؟',
      ctaText: 'تواصل معنا وسنجهّز حساب شركتك.',
      whatsapp: 'كلّمنا على واتساب',
      preview: {
        window: 'حركة · التشغيل اليومي',
        today: 'رحلات اليوم',
        planned: 'رحلات اليوم',
        done: 'تمّت',
        cancelled: 'ملغاة',
        trips: [
          { route: 'خط مدينة نصر', customer: 'مصنع الأمل', time: '7:00 ص', status: 'done' },
          { route: 'خط المعادي', customer: 'شركة النيل', time: '7:30 ص', status: 'done' },
          { route: 'خط 6 أكتوبر', customer: 'مجمع الصناعات', time: '8:00 ص', status: 'planned' },
          { route: 'خط حلوان', customer: 'شركة الدلتا', time: '8:15 ص', status: 'cancelled' },
        ],
        statuses: { done: 'تمّت', planned: 'قادمة', cancelled: 'ملغاة' },
        swapTitle: 'تبديل سائق',
        swapText: 'غاب أحمد، وتولّى محمود رحلة 08:00.',
        profit: 'صافي ربح الشهر',
      },
      compareTitle: 'ودّع الكشكول والإكسل والمكالمات',
      compareHint: 'الفرق الذي تشعر به من أول أسبوع.',
      before: {
        title: 'قبل حركة',
        items: [
          'كشكول الرحلات يتأخر أو يضيع، ولا تعرف ما حدث أمس.',
          'حساب رواتب السائقين آخر الشهر يأخذ أيامًا من الجمع والمراجعة.',
          'ربح كل خط تعرفه بالتقريب، أو لا تعرفه أصلًا.',
          'غياب سائق أو عطل مركبة يضيع في المكالمات والرسائل.',
        ],
      },
      after: {
        title: 'مع حركة',
        items: [
          'رحلات كل يوم جاهزة من الخطوط، وتسجّل أي تغيير في ثوانٍ.',
          'النظام يقترح راتب كل سائق وأجرة كل مركبة من رحلاتهم الفعلية.',
          'ربح كل خط بعد نصيب السائق والمركبة، بالأرقام.',
          'كل تغيير يُسجّل بسببه، ويظهر في التقرير الشهري.',
        ],
      },
      faqTitle: 'أسئلة شائعة',
      faqHint: 'لم تجد إجابتك؟ تواصل معنا وسنرد عليك.',
      faq: [
        {
          title: 'هل أحتاج إلى تثبيت برنامج؟',
          text: 'لا. يعمل حركة من المتصفح على الكمبيوتر والموبايل، دون تثبيت أي شيء.',
        },
        {
          title: 'كيف أحصل على حساب لشركتي؟',
          text: 'تواصل معنا ونتفق على الاشتراك الشهري، ثم ننشئ حساب شركتك ونرسل لك البريد الإلكتروني وكلمة المرور.',
        },
        {
          title: 'هل يرى أحد غيري بيانات شركتي؟',
          text: 'لا. بيانات كل شركة منفصلة تمامًا، ولا يصل إليها إلا حسابات شركتك.',
        },
        {
          title: 'بأي عملة يعمل النظام؟',
          text: 'بالجنيه المصري افتراضيًا، ويمكن اختيار عملة أخرى عند إنشاء حساب شركتك.',
        },
        {
          title: 'ماذا يحدث لو تأخر دفع الاشتراك؟',
          text: 'يُوقف الحساب مؤقتًا وتبقى بياناتك محفوظة كاملة، ويعود كما كان فور الدفع.',
        },
      ],
    },
    contact: {
      title: 'تواصل معنا',
      headline: 'نحن هنا',
      headlineHighlight: 'لنساعدك',
      hint: 'نجهّز حساب كل شركة بأنفسنا. تواصل معنا لطلب حساب أو لأي سؤال، ونرد عليك في مواعيد العمل.',
      phone: 'الهاتف',
      phoneHint: 'اتصل بنا مباشرة.',
      phoneAction: 'اتصل الآن',
      whatsapp: 'واتساب',
      whatsappHint: 'أرسل لنا رسالة، وسنرد عليك هناك.',
      whatsappAction: 'افتح المحادثة',
      whatsappMessage: 'مرحبًا، أريد حسابًا على حركة لشركتي.',
      email: 'البريد الإلكتروني',
      emailHint: 'اكتب لنا اسم شركتك ورقم هاتفك.',
      emailAction: 'اكتب رسالة',
      emailSubject: 'طلب حساب على حركة',
      hours: 'مواعيد العمل',
      hoursText: 'من الأحد إلى الخميس، من 9 صباحًا حتى 5 مساءً.',
      address: 'العنوان',
      addressText: 'القاهرة، مصر.',
      accountTitle: 'كيف تحصل على حساب؟',
      accountHint: 'ثلاث خطوات فقط، ونحن نتولى إعداد الحساب.',
      accountSteps: [
        'تواصل معنا بأي طريقة من الطرق السابقة.',
        'نتفق معك على الباقة ومدة الاشتراك.',
        'ننشئ حساب شركتك ونرسل لك البريد الإلكتروني وكلمة المرور.',
      ],
      signInHint: 'لديك حساب بالفعل؟',
      signInText: 'ادخل لمتابعة رحلات اليوم وحسابات الشهر.',
      signIn: 'تسجيل الدخول',
    },
    pricing: {
      title: 'الأسعار',
      headline: 'اشتراك واضح',
      headlineHighlight: 'على قدر أسطولك',
      hint: 'تدفع حسب عدد المركبات العاملة لديك، وكل أقسام النظام متاحة في كل الباقات. وكلما اشتركت لمدة أطول وفّرت أكثر.',
      loading: 'جارٍ تحميل الأسعار...',
      load: 'تعذّر تحميل الأسعار. حاول مرة أخرى.',
      empty: 'لم ننشر الأسعار بعد. تواصل معنا ونرسل لك عرض سعر يناسب أسطولك.',
      period: 'مدة الاشتراك',
      periods: { 1: 'شهر', 3: '3 شهور', 6: '6 شهور', 12: 'سنة' },
      per: { 1: 'في الشهر', 3: 'لكل 3 شهور', 6: 'لكل 6 شهور', 12: 'في السنة' },
      save: 'وفّر',
      vehicles: 'كم مركبة تعمل لديك؟',
      vehiclesHint: 'اكتب العدد لنحدد لك الباقة المناسبة.',
      currency: 'العملة',
      upTo: 'عدد المركبات: حتى',
      anySize: 'عدد المركبات حسب احتياجك',
      agreed: 'حسب الاتفاق',
      agreedHint: 'نتفق معك على السعر حسب حجم أسطولك.',
      instead: 'بدلًا من',
      fits: 'تناسب أسطولك',
      tooMany: 'أسطولك أكبر من الباقات المعروضة. تواصل معنا لنتفق على باقة تناسبه.',
      choose: 'اطلب هذه الباقة',
      contact: 'تواصل معنا',
      included: [
        'كل الأقسام: الخطوط والتشغيل اليومي والسائقون والمركبات والمصروفات والتقارير',
        'عدد غير محدود من الخطوط والسائقين والشركات المتعاقدة',
        'بالعربية والإنجليزية، على الكمبيوتر والهاتف',
        'نجهّز حساب شركتك بأنفسنا',
      ],
      notesTitle: 'قبل أن تختار',
      notes: [
        'تُحسب المركبات العاملة فقط؛ المركبة الموقوفة لا تدخل في عدد الباقة.',
        'عند الوصول إلى حد الباقة لا يمكن إضافة مركبة جديدة حتى تُرقّى الباقة أو تُوقف مركبة أخرى.',
        'الخصم يُحسب على سعر المدة كلها.',
      ],
    },
    offers: {
      label: 'العروض الحالية',
      off: 'خصم',
      trial: 'جرّب مجانًا لمدة',
      days: { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يومًا' },
      onPlans: 'على:',
      forPeriods: 'عند الاشتراك لمدة',
      or: 'أو',
      until: 'حتى',
      see: 'شاهد الأسعار',
    },
  },
  en: {
    home: {
      eyebrow: 'Staff transport management',
      title: 'Run the staff transport of your client companies',
      titleHighlight: 'from one place',
      lead: 'Record your client companies and their routes, follow each day\u2019s trips, work out driver salaries and vehicle pay, and see the profit of every route at the end of the month.',
      contact: 'Request an account',
      signIn: 'Sign in',
      featuresTitle: 'Everything a transport company needs',
      featuresHint: 'From recording routes to working out profit, in simple steps your team understands from day one.',
      features: {
        customers: {
          title: 'Client companies and routes',
          text: 'Each company has its routes, outbound and return times, trip price, and the driver and vehicle on each route.',
        },
        operations: {
          title: 'Daily operations',
          text: 'Each day\u2019s trips come ready from the routes. Record a cancellation or a driver or vehicle change with its reason, and add extra trips.',
        },
        fleet: {
          title: 'Drivers and vehicles',
          text: 'Every driver and vehicle with license expiry dates, whether the vehicle is owned, rented, or a contractor\u2019s.',
        },
        pay: {
          title: 'Salaries and vehicle pay',
          text: 'The system suggests each driver\u2019s salary and each vehicle\u2019s pay from the trips they actually made, and you can change it before recording it.',
        },
        expenses: {
          title: 'Expenses',
          text: 'Record fuel, maintenance, rent, and every expense, for a vehicle, a driver, or the whole company.',
        },
        reports: {
          title: 'Monthly report',
          text: 'Revenue, expenses, and net profit, with the driver\u2019s, vehicle\u2019s, and company\u2019s share of every route.',
        },
      },
      promises: {
        languages: 'In Arabic and English',
        devices: 'Works on computers and phones',
        privacy: 'Each company\u2019s data is separate and protected',
      },
      stepsTitle: 'How do you start?',
      stepsHint: 'You do not create the account yourself; we set it up for you.',
      steps: [
        { title: 'Contact us', text: 'Tell us your company name and how many vehicles you run.' },
        { title: 'We set up your account', text: 'We create your company account and send you the sign-in details.' },
        { title: 'Start working', text: 'Add your client companies and routes, and follow operations from day one.' },
      ],
      ctaTitle: 'Ready to organize your company\u2019s work?',
      ctaText: 'Contact us and we will set up your company account.',
      whatsapp: 'Message us on WhatsApp',
      preview: {
        window: 'Haraka · Daily operations',
        today: 'Today\u2019s trips',
        planned: 'Today\u2019s trips',
        done: 'Done',
        cancelled: 'Cancelled',
        trips: [
          { route: 'Nasr City route', customer: 'Al Amal Factory', time: '7:00 AM', status: 'done' },
          { route: 'Maadi route', customer: 'Nile Company', time: '7:30 AM', status: 'done' },
          { route: '6th of October route', customer: 'Industrial Park', time: '8:00 AM', status: 'planned' },
          { route: 'Helwan route', customer: 'Delta Company', time: '8:15 AM', status: 'cancelled' },
        ],
        statuses: { done: 'Done', planned: 'Coming', cancelled: 'Cancelled' },
        swapTitle: 'Driver changed',
        swapText: 'Ahmed was absent, so Mahmoud took the 08:00 trip.',
        profit: 'Net profit this month',
      },
      compareTitle: 'Say goodbye to notebooks, spreadsheets, and phone calls',
      compareHint: 'The difference you feel from the first week.',
      before: {
        title: 'Before Haraka',
        items: [
          'The trip notebook arrives late or gets lost, and nobody knows what happened yesterday.',
          'Working out driver salaries at the end of the month takes days of adding up and checking.',
          'You know each route\u2019s profit roughly, or not at all.',
          'An absent driver or a broken vehicle gets lost in calls and messages.',
        ],
      },
      after: {
        title: 'With Haraka',
        items: [
          'Each day\u2019s trips come ready from the routes, and any change takes seconds.',
          'The system suggests each driver\u2019s salary and each vehicle\u2019s pay from the trips they made.',
          'Each route\u2019s profit after the driver\u2019s and vehicle\u2019s share, in numbers.',
          'Every change is recorded with its reason and shows in the monthly report.',
        ],
      },
      faqTitle: 'Common questions',
      faqHint: 'Did not find your answer? Contact us and we will reply.',
      faq: [
        {
          title: 'Do I need to install anything?',
          text: 'No. Haraka runs in the browser on computers and phones, with nothing to install.',
        },
        {
          title: 'How do I get an account for my company?',
          text: 'Contact us and we agree on the monthly subscription, then we create your company account and send you the email and password.',
        },
        {
          title: 'Can anyone else see my company\u2019s data?',
          text: 'No. Each company\u2019s data is fully separate, and only your company\u2019s logins can reach it.',
        },
        {
          title: 'Which currency does it use?',
          text: 'Egyptian pounds by default, and another currency can be chosen when your company account is created.',
        },
        {
          title: 'What happens if the subscription is paid late?',
          text: 'The account is paused and all your data is kept, and it comes back as it was once paid.',
        },
      ],
    },
    contact: {
      title: 'Contact us',
      headline: "We're here",
      headlineHighlight: 'to help',
      hint: 'We set up every company account ourselves. Contact us to request an account or ask anything, and we will reply during working hours.',
      phone: 'Phone',
      phoneHint: 'Call us directly.',
      phoneAction: 'Call now',
      whatsapp: 'WhatsApp',
      whatsappHint: 'Send us a message and we will reply there.',
      whatsappAction: 'Open the chat',
      whatsappMessage: 'Hello, I would like a Haraka account for my company.',
      email: 'Email',
      emailHint: 'Write us your company name and phone number.',
      emailAction: 'Write an email',
      emailSubject: 'Haraka account request',
      hours: 'Working hours',
      hoursText: 'Sunday to Thursday, 9 am to 5 pm.',
      address: 'Address',
      addressText: 'Cairo, Egypt.',
      accountTitle: 'How do you get an account?',
      accountHint: 'Just three steps, and we set the account up for you.',
      accountSteps: [
        'Contact us in any of the ways above.',
        'We agree with you on the plan and how long to subscribe.',
        'We create your company account and send you the email and password.',
      ],
      signInHint: 'Already have an account?',
      signInText: "Sign in to follow today's trips and the month's accounts.",
      signIn: 'Sign in',
    },
    pricing: {
      title: 'Pricing',
      headline: 'Clear pricing',
      headlineHighlight: 'that fits your fleet',
      hint: 'You pay by the number of vehicles you run, and every plan includes every section. The longer you subscribe, the more you save.',
      loading: 'Loading prices...',
      load: 'The prices could not be loaded. Try again.',
      empty: 'We have not published our prices yet. Contact us and we will send you a quote for your fleet.',
      period: 'Subscription length',
      periods: { 1: 'Month', 3: '3 months', 6: '6 months', 12: 'Year' },
      per: { 1: 'per month', 3: 'per 3 months', 6: 'per 6 months', 12: 'per year' },
      save: 'Save',
      vehicles: 'How many vehicles do you run?',
      vehiclesHint: 'Type the number and we will point out the plan that fits.',
      currency: 'Currency',
      upTo: 'Vehicles: up to',
      anySize: 'As many vehicles as you need',
      agreed: 'By agreement',
      agreedHint: 'We agree the price with you based on your fleet.',
      instead: 'instead of',
      fits: 'Fits your fleet',
      tooMany: 'Your fleet is larger than these plans. Contact us to agree on one that fits.',
      choose: 'Ask for this plan',
      contact: 'Contact us',
      included: [
        'Every section: routes, daily operations, drivers, vehicles, expenses, and reports',
        'Unlimited routes, drivers, and contracted companies',
        'In Arabic and English, on computer and phone',
        'We set up your company account for you',
      ],
      notesTitle: 'Before you choose',
      notes: [
        'Only active vehicles count; an inactive vehicle does not count toward the plan.',
        'At the plan limit a new vehicle cannot be added until the plan is upgraded or another vehicle is made inactive.',
        'The discount applies to the price of the whole period.',
      ],
    },
    offers: {
      label: 'Current offers',
      off: 'off',
      trial: 'Try it free for',
      days: { one: '1 day', two: '2 days', few: 'days', many: 'days' },
      onPlans: 'On:',
      forPeriods: 'when you subscribe for',
      or: 'or',
      until: 'until',
      see: 'See prices',
    },
  },
};
