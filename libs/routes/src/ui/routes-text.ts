import { Language } from '@routeops/shared/i18n';
import { RouteProblem, Weekday } from '../domain/transport-route';

export interface RoutesText {
  readonly problems: Record<RouteProblem, string>;
  readonly weekdays: Record<Weekday, string>;
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly search: string;
    readonly searchHint: string;
    readonly filter: string;
    readonly allCustomers: string;
    readonly noMatch: string;
    readonly copy: string;
    readonly copyTitle: string;
    readonly name: string;
    readonly customer: string;
    readonly crew: string;
    readonly times: string;
    readonly outboundTime: string;
    readonly returnTime: string;
    readonly days: string;
    readonly tripPrice: string;
    readonly perShift: string;
    readonly perTrip: string;
    readonly everyDay: string;
    readonly daySeparator: string;
    readonly notSet: string;
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
    readonly copyTitle: string;
    readonly copyHint: string;
    readonly routeTitle: string;
    readonly crewTitle: string;
    readonly crewHint: string;
    readonly pathTitle: string;
    readonly name: string;
    readonly nameHint: string;
    readonly customer: string;
    readonly customerHint: string;
    readonly chooseCustomer: string;
    readonly noCustomers: string;
    readonly customersLink: string;
    readonly noDrivers: string;
    readonly driversLink: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly chooseDriver: string;
    readonly notSet: string;
    readonly startPoint: string;
    readonly startPointHint: string;
    readonly endPoint: string;
    readonly endPointHint: string;
    readonly tripsTitle: string;
    readonly tripsHint: string;
    readonly outboundTime: string;
    readonly outboundHint: string;
    readonly returnTime: string;
    readonly returnHint: string;
    readonly days: string;
    readonly daysHint: string;
    readonly everyDay: string;
    readonly priceTitle: string;
    readonly tripPrice: string;
    readonly tripPriceHint: string;
    readonly shiftPrice: string;
    readonly shiftPriceHint: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly active: string;
    readonly activeHint: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly added: string;
    readonly saved: string;
    readonly removed: string;
  };
}

export const routesText: Record<Language, RoutesText> = {
  ar: {
    problems: {
      name: 'أدخل اسم الخط.',
      nameTaken: 'يوجد خط بنفس الاسم لهذه الشركة. اختر اسمًا آخر.',
      customer: 'اختر الشركة المتعاقدة.',
      driver: 'اختر السائق.',
      startPoint: 'أدخل نقطة البداية.',
      endPoint: 'أدخل نقطة النهاية.',
      tooLong: 'النص أطول من المسموح.',
      time: 'أدخل ميعادًا صحيحًا.',
      trip: 'حدد ميعاد رحلة الذهاب أو رحلة العودة على الأقل.',
      days: 'اختر يومًا واحدًا على الأقل.',
      tripPrice: 'أدخل السعر بالأرقام فقط، مثل 150 أو 150.50',
      inactiveChoice: 'الخط العامل يحتاج شركة وسائقًا ومركبة غير موقوفين. اختر غيرهم، أو فعّلهم من صفحاتهم، أو أوقف الخط.',
      inUse: 'لا يمكن حذف هذا الخط لأن رحلات ما زالت مربوطة به. احذف الرحلات أو اترك الخط موقوفًا.',
      load: 'تعذّر تحميل الخطوط. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      remove: 'تعذّر حذف الخط. حاول مرة أخرى.',
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
      title: 'الخطوط',
      add: 'إضافة خط',
      hint: 'كل خط يحدد أي مركبة وأي سائق ينقلان موظفي أي شركة متعاقدة، وفي أي مواعيد وأيام.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي خط بعد. ابدأ بإضافة أول خط.',
      search: 'بحث',
      searchHint: 'اسم الخط أو المكان أو السائق أو رقم اللوحة',
      filter: 'عرض خطوط',
      allCustomers: 'كل الشركات',
      noMatch: 'لا توجد خطوط تطابق البحث أو الشركة المختارة.',
      copy: 'نسخ',
      copyTitle: 'نسخ هذا الخط لشركة متعاقدة أخرى',
      name: 'الخط',
      customer: 'الشركة المتعاقدة',
      crew: 'السائق والمركبة',
      times: 'المواعيد',
      outboundTime: 'ذهاب',
      returnTime: 'عودة',
      days: 'الأيام',
      tripPrice: 'السعر',
      perShift: 'للوردية: ذهاب وعودة',
      perTrip: 'للرحلة',
      everyDay: 'كل يوم',
      daySeparator: '، ',
      notSet: 'لم يُحدد',
      work: 'الحالة',
      working: 'يعمل',
      stopped: 'متوقف',
      edit: 'تعديل',
      remove: 'حذف',
      confirmRemove: 'تأكيد',
    },
    form: {
      addTitle: 'إضافة خط جديد',
      editTitle: 'تعديل بيانات الخط',
      copyTitle: 'نسخ خط لشركة أخرى',
      copyHint: 'اختر الشركة، ثم غيّر المركبة والسائق والمواعيد والأيام حسب هذه الشركة.',
      routeTitle: 'الخط والشركة',
      crewTitle: 'السائق والمركبة',
      crewHint: 'السائق مطلوب، ويمكنك تحديد المركبة لاحقًا.',
      pathTitle: 'خط السير',
      name: 'اسم الخط',
      nameHint: 'اسم تعرف به الخط، مثل: مدينة نصر. يمكن استخدام نفس الاسم لأكثر من شركة.',
      customer: 'الشركة المتعاقدة',
      customerHint: 'الشركة التي ينقل هذا الخط موظفيها.',
      chooseCustomer: 'اختر الشركة',
      noCustomers: 'لا توجد شركة متعاقدة تعمل معها الآن، وكل خط يحتاج شركة. أضف شركة أو فعّلها من صفحة',
      customersLink: 'الشركات المتعاقدة',
      noDrivers: 'لا يوجد سائق يعمل الآن، وكل خط يحتاج سائقًا. أضف سائقًا أو فعّله من صفحة',
      driversLink: 'السائقين',
      vehicle: 'المركبة',
      driver: 'السائق',
      chooseDriver: 'اختر السائق',
      notSet: 'لم يُحدد بعد',
      startPoint: 'نقطة البداية',
      startPointHint: 'المكان الذي تبدأ منه رحلة الذهاب، مثل: ميدان الحجاز.',
      endPoint: 'نقطة النهاية',
      endPointHint: 'غالبًا مقر الشركة أو المصنع.',
      tripsTitle: 'المواعيد والأيام',
      tripsHint: 'حدد ميعاد رحلة واحدة على الأقل.',
      outboundTime: 'ميعاد الذهاب',
      outboundHint: 'توصيل الموظفين إلى العمل.',
      returnTime: 'ميعاد العودة',
      returnHint: 'عودة الموظفين من العمل.',
      days: 'أيام العمل',
      daysHint: 'الأيام التي يعمل فيها هذا الخط كل أسبوع.',
      everyDay: 'اختيار كل الأيام',
      priceTitle: 'السعر والملاحظات',
      tripPrice: 'سعر الرحلة',
      tripPriceHint:
        'المبلغ الذي تدفعه الشركة المتعاقدة عن هذه الرحلة في كل يوم. يُستخدم لحساب الإيراد في التقارير. تغيير السعر لا يغيّر الرحلات التي مضت ولها سعر، أما الرحلات التي تمّت بلا سعر فتأخذ السعر الجديد.',
      shiftPrice: 'سعر الوردية (ذهاب وعودة)',
      shiftPriceHint:
        'المبلغ الذي تدفعه الشركة المتعاقدة عن الذهاب والعودة معًا في اليوم. إذا تمّ اتجاه واحد فقط يُحسب نصف السعر. تغيير السعر لا يغيّر الرحلات التي مضت ولها سعر، أما الرحلات التي تمّت بلا سعر فتأخذ السعر الجديد.',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذا الخط.',
      active: 'الخط يعمل حاليًا',
      activeHint: 'الخط الموقوف لا تُجهَّز له رحلات في الأيام القادمة، وتبقى رحلاته السابقة في التقارير.',
      add: 'إضافة الخط',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة الخط.',
      saved: 'تم حفظ التعديلات.',
      removed: 'تم حذف الخط.',
    },
  },
  en: {
    problems: {
      name: 'Enter the route name.',
      nameTaken: 'This company already has a route with this name. Choose another name.',
      customer: 'Choose the client company.',
      driver: 'Choose the driver.',
      startPoint: 'Enter the start point.',
      endPoint: 'Enter the end point.',
      tooLong: 'This text is too long.',
      time: 'Enter a valid time.',
      trip: 'Set the outbound or return trip time, at least one.',
      days: 'Choose at least one day.',
      tripPrice: 'Enter the price in numbers only, like 150 or 150.50',
      inactiveChoice: 'An active route needs a company, driver, and vehicle that are not inactive. Choose others, turn them back on from their pages, or stop the route.',
      inUse: 'This route cannot be deleted because trips still name it. Clear those trips, or leave the route stopped.',
      load: 'Could not load your routes. Please try again.',
      save: 'Could not save. Please try again.',
      remove: 'Could not delete the route. Please try again.',
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
      title: 'Routes',
      add: 'Add route',
      hint: 'Each route sets which vehicle and driver carry which client company staff, at which times and on which days.',
      loading: 'Loading...',
      empty: 'You have not added any route yet. Start by adding the first one.',
      search: 'Search',
      searchHint: 'Route, place, driver, or plate number',
      filter: 'Show routes of',
      allCustomers: 'All companies',
      noMatch: 'No route matches the search or the chosen company.',
      copy: 'Copy',
      copyTitle: 'Copy this route for another client company',
      name: 'Route',
      customer: 'Client company',
      crew: 'Driver and vehicle',
      times: 'Times',
      outboundTime: 'Out',
      returnTime: 'Back',
      days: 'Days',
      tripPrice: 'Price',
      perShift: 'per shift: out and back',
      perTrip: 'per trip',
      everyDay: 'Every day',
      daySeparator: ', ',
      notSet: 'Not set',
      work: 'Status',
      working: 'Running',
      stopped: 'Stopped',
      edit: 'Edit',
      remove: 'Delete',
      confirmRemove: 'Confirm',
    },
    form: {
      addTitle: 'Add a new route',
      editTitle: 'Edit route details',
      copyTitle: 'Copy a route for another company',
      copyHint: 'Choose the company, then change the vehicle, driver, times, and days for it.',
      routeTitle: 'Route and company',
      crewTitle: 'Driver and vehicle',
      crewHint: 'The driver is required; you can set the vehicle later.',
      pathTitle: 'Path',
      name: 'Route name',
      nameHint: 'A name you know the route by, e.g. Nasr City. The same name can serve more than one company.',
      customer: 'Client company',
      customerHint: 'The company whose staff this route carries.',
      chooseCustomer: 'Choose a company',
      noCustomers: 'No contracted company is active now, and every route needs one. Add or turn one back on from',
      customersLink: 'Contracted companies',
      noDrivers: 'No driver is working now, and every route needs one. Add or turn one back on from',
      driversLink: 'Drivers',
      vehicle: 'Vehicle',
      driver: 'Driver',
      chooseDriver: 'Choose a driver',
      notSet: 'Not set yet',
      startPoint: 'Start point',
      startPointHint: 'Where the outbound trip starts, e.g. Hegaz Square.',
      endPoint: 'End point',
      endPointHint: 'Usually the company or factory site.',
      tripsTitle: 'Times and days',
      tripsHint: 'Set at least one trip time.',
      outboundTime: 'Outbound time',
      outboundHint: 'Taking staff to work.',
      returnTime: 'Return time',
      returnHint: 'Taking staff home.',
      days: 'Working days',
      daysHint: 'The days this route runs every week.',
      everyDay: 'Choose every day',
      priceTitle: 'Price and notes',
      tripPrice: 'Trip price',
      tripPriceHint:
        'What the client company pays for this trip each day. Reports use it to work out revenue. Changing it does not change past trips that have a price; done trips with no price take the new one.',
      shiftPrice: 'Shift price (out and back)',
      shiftPriceHint:
        'What the client company pays for the outbound and return trips together each day. When only one of them runs, half the price counts. Changing it does not change past trips that have a price; done trips with no price take the new one.',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this route.',
      active: 'This route is currently running',
      activeHint: 'A stopped route gets no trips on coming days, and its past trips stay in the reports.',
      add: 'Add route',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The route was added.',
      saved: 'Your changes were saved.',
      removed: 'The route was deleted.',
    },
  },
};
