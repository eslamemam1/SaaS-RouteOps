import { Language } from '@routeops/shared/i18n';
import { RouteProblem, Weekday } from '../domain/transport-route';

export interface RoutesText {
  readonly problems: Record<RouteProblem, string>;
  readonly weekdays: Record<Weekday, string>;
  readonly list: {
    readonly back: string;
    readonly title: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly name: string;
    readonly customer: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly outboundTime: string;
    readonly returnTime: string;
    readonly days: string;
    readonly everyDay: string;
    readonly daySeparator: string;
    readonly notSet: string;
    readonly work: string;
    readonly working: string;
    readonly stopped: string;
    readonly edit: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly name: string;
    readonly nameHint: string;
    readonly customer: string;
    readonly customerHint: string;
    readonly chooseCustomer: string;
    readonly noCustomers: string;
    readonly customersLink: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly assignLater: string;
    readonly notSet: string;
    readonly startPoint: string;
    readonly startPointHint: string;
    readonly endPoint: string;
    readonly endPointHint: string;
    readonly tripsTitle: string;
    readonly tripsHint: string;
    readonly outboundTime: string;
    readonly returnTime: string;
    readonly days: string;
    readonly daysHint: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly active: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly added: string;
    readonly saved: string;
  };
}

export const routesText: Record<Language, RoutesText> = {
  ar: {
    problems: {
      name: 'أدخل اسم الخط.',
      customer: 'اختر الشركة المتعاقدة.',
      startPoint: 'أدخل نقطة البداية.',
      endPoint: 'أدخل نقطة النهاية.',
      tooLong: 'النص أطول من المسموح.',
      time: 'أدخل ميعادًا صحيحًا.',
      trip: 'حدد ميعاد رحلة الذهاب أو رحلة العودة على الأقل.',
      days: 'اختر يومًا واحدًا على الأقل.',
      load: 'تعذّر تحميل الخطوط. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    weekdays: {
      saturday: 'السبت',
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
    },
    list: {
      back: 'الرجوع إلى الصفحة الرئيسية',
      title: 'الخطوط',
      hint: 'كل خط يحدد أي مركبة وأي سائق ينقلان موظفي أي شركة متعاقدة، وفي أي مواعيد وأيام.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي خط بعد. ابدأ بإضافة أول خط من النموذج بالأسفل.',
      name: 'الخط',
      customer: 'الشركة المتعاقدة',
      vehicle: 'المركبة',
      driver: 'السائق',
      outboundTime: 'الذهاب',
      returnTime: 'العودة',
      days: 'الأيام',
      everyDay: 'كل يوم',
      daySeparator: '، ',
      notSet: 'لم يُحدد',
      work: 'الحالة',
      working: 'يعمل',
      stopped: 'متوقف',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة خط جديد',
      editTitle: 'تعديل بيانات الخط',
      name: 'اسم الخط',
      nameHint: 'اسم تعرف به الخط، مثل: مصنع الدلتا - مدينة نصر.',
      customer: 'الشركة المتعاقدة',
      customerHint: 'الشركة التي ينقل هذا الخط موظفيها.',
      chooseCustomer: 'اختر الشركة',
      noCustomers: 'لا توجد شركات متعاقدة بعد. أضف شركة أولًا من صفحة',
      customersLink: 'الشركات المتعاقدة',
      vehicle: 'المركبة (اختياري)',
      driver: 'السائق (اختياري)',
      assignLater: 'يمكنك تحديده لاحقًا.',
      notSet: 'لم يُحدد بعد',
      startPoint: 'نقطة البداية',
      startPointHint: 'المكان الذي تبدأ منه رحلة الذهاب، مثل: ميدان الحجاز.',
      endPoint: 'نقطة النهاية',
      endPointHint: 'غالبًا مقر الشركة أو المصنع.',
      tripsTitle: 'المواعيد',
      tripsHint: 'حدد ميعاد رحلة واحدة على الأقل.',
      outboundTime: 'ميعاد رحلة الذهاب (توصيل الموظفين إلى العمل)',
      returnTime: 'ميعاد رحلة العودة (رجوع الموظفين من العمل)',
      days: 'أيام العمل',
      daysHint: 'الأيام التي يعمل فيها هذا الخط كل أسبوع.',
      notes: 'ملاحظات (اختياري)',
      notesHint: 'أي معلومة تريد تذكّرها عن هذا الخط.',
      active: 'الخط يعمل حاليًا',
      add: 'إضافة الخط',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة الخط.',
      saved: 'تم حفظ التعديلات.',
    },
  },
  en: {
    problems: {
      name: 'Enter the route name.',
      customer: 'Choose the client company.',
      startPoint: 'Enter the start point.',
      endPoint: 'Enter the end point.',
      tooLong: 'This text is too long.',
      time: 'Enter a valid time.',
      trip: 'Set the outbound or return trip time, at least one.',
      days: 'Choose at least one day.',
      load: 'Could not load your routes. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    weekdays: {
      saturday: 'Saturday',
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
    },
    list: {
      back: 'Back to home',
      title: 'Routes',
      hint: 'Each route sets which vehicle and driver carry which client company staff, at which times and on which days.',
      loading: 'Loading...',
      empty: 'You have not added any route yet. Add the first one using the form below.',
      name: 'Route',
      customer: 'Client company',
      vehicle: 'Vehicle',
      driver: 'Driver',
      outboundTime: 'Outbound',
      returnTime: 'Return',
      days: 'Days',
      everyDay: 'Every day',
      daySeparator: ', ',
      notSet: 'Not set',
      work: 'Status',
      working: 'Running',
      stopped: 'Stopped',
      edit: 'Edit',
    },
    form: {
      addTitle: 'Add a new route',
      editTitle: 'Edit route details',
      name: 'Route name',
      nameHint: 'A name you know the route by, e.g. Delta Factory - Nasr City.',
      customer: 'Client company',
      customerHint: 'The company whose staff this route carries.',
      chooseCustomer: 'Choose a company',
      noCustomers: 'There are no client companies yet. First add one from',
      customersLink: 'Client companies',
      vehicle: 'Vehicle (optional)',
      driver: 'Driver (optional)',
      assignLater: 'You can set this later.',
      notSet: 'Not set yet',
      startPoint: 'Start point',
      startPointHint: 'Where the outbound trip starts, e.g. Hegaz Square.',
      endPoint: 'End point',
      endPointHint: 'Usually the company or factory site.',
      tripsTitle: 'Times',
      tripsHint: 'Set at least one trip time.',
      outboundTime: 'Outbound trip time (taking staff to work)',
      returnTime: 'Return trip time (taking staff home)',
      days: 'Working days',
      daysHint: 'The days this route runs every week.',
      notes: 'Notes (optional)',
      notesHint: 'Anything you want to remember about this route.',
      active: 'This route is currently running',
      add: 'Add route',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The route was added.',
      saved: 'Your changes were saved.',
    },
  },
};
