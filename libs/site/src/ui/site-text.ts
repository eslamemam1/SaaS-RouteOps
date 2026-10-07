import { Language } from '@routeops/shared/i18n';

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

interface TitledText {
  readonly title: string;
  readonly text: string;
}

export interface SiteText {
  readonly home: {
    readonly eyebrow: string;
    readonly title: string;
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
  };
  readonly contact: {
    readonly title: string;
    readonly hint: string;
    readonly phone: string;
    readonly phoneHint: string;
    readonly whatsapp: string;
    readonly whatsappHint: string;
    readonly whatsappMessage: string;
    readonly email: string;
    readonly emailHint: string;
    readonly emailSubject: string;
    readonly hours: string;
    readonly hoursText: string;
    readonly address: string;
    readonly addressText: string;
    readonly accountTitle: string;
    readonly accountSteps: readonly string[];
    readonly signInHint: string;
    readonly signIn: string;
  };
}

export const siteText: Record<Language, SiteText> = {
  ar: {
    home: {
      eyebrow: 'نظام إدارة نقل الموظفين',
      title: 'نظّم نقل موظفي الشركات المتعاقدة معك من مكان واحد',
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
          text: 'بيانات كل سائق ومركبة وتواريخ انتهاء الرخص، والمركبات المملوكة والمؤجّرة ومركبات المتعاقدين.',
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
    },
    contact: {
      title: 'تواصل معنا',
      hint: 'نجهّز حساب كل شركة بأنفسنا. تواصل معنا لطلب حساب أو لأي سؤال، ونرد عليك في مواعيد العمل.',
      phone: 'الهاتف',
      phoneHint: 'اتصل بنا مباشرة.',
      whatsapp: 'واتساب',
      whatsappHint: 'أرسل لنا رسالة، وسنرد عليك هناك.',
      whatsappMessage: 'مرحبًا، أريد حسابًا على حركة لشركتي.',
      email: 'البريد الإلكتروني',
      emailHint: 'اكتب لنا اسم شركتك ورقم هاتفك.',
      emailSubject: 'طلب حساب على حركة',
      hours: 'مواعيد العمل',
      hoursText: 'من الأحد إلى الخميس، من 9 صباحًا حتى 5 مساءً.',
      address: 'العنوان',
      addressText: 'القاهرة، مصر.',
      accountTitle: 'كيف تحصل على حساب؟',
      accountSteps: [
        'تواصل معنا بأي طريقة من الطرق السابقة.',
        'نتفق معك على الاشتراك الشهري.',
        'ننشئ حساب شركتك ونرسل لك البريد الإلكتروني وكلمة المرور.',
      ],
      signInHint: 'لديك حساب بالفعل؟',
      signIn: 'تسجيل الدخول',
    },
  },
  en: {
    home: {
      eyebrow: 'Staff transport management',
      title: 'Run the staff transport of your client companies from one place',
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
    },
    contact: {
      title: 'Contact us',
      hint: 'We set up every company account ourselves. Contact us to request an account or ask anything, and we will reply during working hours.',
      phone: 'Phone',
      phoneHint: 'Call us directly.',
      whatsapp: 'WhatsApp',
      whatsappHint: 'Send us a message and we will reply there.',
      whatsappMessage: 'Hello, I would like a Haraka account for my company.',
      email: 'Email',
      emailHint: 'Write us your company name and phone number.',
      emailSubject: 'Haraka account request',
      hours: 'Working hours',
      hoursText: 'Sunday to Thursday, 9 am to 5 pm.',
      address: 'Address',
      addressText: 'Cairo, Egypt.',
      accountTitle: 'How do you get an account?',
      accountSteps: [
        'Contact us in any of the ways above.',
        'We agree with you on the monthly subscription.',
        'We create your company account and send you the email and password.',
      ],
      signInHint: 'Already have an account?',
      signIn: 'Sign in',
    },
  },
};
