import { Language } from '@routeops/shared/i18n';
import { CompanyAccountProblem } from '../domain/company-account';

export interface OrganizationsText {
  readonly problems: Record<CompanyAccountProblem, string>;
  readonly signIn: {
    readonly title: string;
    readonly hint: string;
    readonly email: string;
    readonly password: string;
    readonly submit: string;
  };
  readonly home: {
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
    readonly reports: string;
    readonly reportsHint: string;
    readonly operatorTitle: string;
    readonly signOut: string;
  };
  readonly provision: {
    readonly title: string;
    readonly hint: string;
    readonly name: string;
    readonly email: string;
    readonly password: string;
    readonly passwordHint: string;
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
      emailTaken: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
      operatorOnly: 'إنشاء الشركات متاح لمدير الموقع فقط.',
      signIn: 'تعذّر تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.',
      load: 'تعذّر تحميل بيانات الشركة. حاول مرة أخرى.',
      create: 'تعذّر إنشاء الشركة. حاول مرة أخرى.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    signIn: {
      title: 'تسجيل الدخول',
      hint: 'أدخل البريد الإلكتروني وكلمة المرور التي أرسلها لك مدير الموقع.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      submit: 'دخول',
    },
    home: {
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
      reports: 'التقارير',
      reportsHint: 'عدد الرحلات التي تمّت كل شهر، لكل شركة متعاقدة ومركبة وسائق.',
      operatorTitle: 'لوحة مدير الموقع',
      signOut: 'تسجيل الخروج',
    },
    provision: {
      title: 'إنشاء حساب لشركة نقل جديدة',
      hint: 'أدخل بيانات شركة النقل المشتركة معك. ستستخدم الشركة البريد الإلكتروني وكلمة المرور لتسجيل الدخول.',
      name: 'اسم شركة النقل',
      email: 'البريد الإلكتروني لتسجيل الدخول',
      password: 'كلمة المرور',
      passwordHint: '6 أحرف أو أرقام على الأقل.',
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
      emailTaken: 'An account with this email already exists.',
      operatorOnly: 'Only the site manager can create companies.',
      signIn: 'Could not sign in. Check the email and password.',
      load: 'Could not load your company. Please try again.',
      create: 'Could not create the company. Please try again.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    signIn: {
      title: 'Sign in',
      hint: 'Enter the email and password the site manager sent you.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
    },
    home: {
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
      reports: 'Reports',
      reportsHint: 'How many trips were done each month, per client company, vehicle, and driver.',
      operatorTitle: 'Site manager panel',
      signOut: 'Sign out',
    },
    provision: {
      title: 'Create an account for a new transport company',
      hint: 'Enter the details of the transport company that subscribed with you. The company signs in with this email and password.',
      name: 'Transport company name',
      email: 'Sign-in email',
      password: 'Password',
      passwordHint: 'At least 6 letters or numbers.',
      submit: 'Create account',
      created:
        'The company account was created. Send them the email and password so they can start.',
    },
  },
};
