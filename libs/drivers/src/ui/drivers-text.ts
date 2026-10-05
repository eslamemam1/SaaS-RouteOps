import { Language } from '@routeops/shared/i18n';
import { DriverProblem } from '../domain/driver';

export interface DriversText {
  readonly problems: Record<DriverProblem, string>;
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly fullName: string;
    readonly phone: string;
    readonly nationalId: string;
    readonly licenseNumber: string;
    readonly licenseExpiry: string;
    readonly expired: string;
    readonly work: string;
    readonly working: string;
    readonly stopped: string;
    readonly edit: string;
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
    readonly monthlySalary: string;
    readonly amountHint: string;
    readonly tripPay: string;
    readonly tripPayHint: string;
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

export const driversText: Record<Language, DriversText> = {
  ar: {
    problems: {
      name: 'أدخل اسم السائق.',
      tooLong: 'النص أطول من المسموح.',
      nationalId: 'الرقم القومي يحتوي على أرقام وحروف إنجليزية فقط.',
      nationalIdTaken: 'هذا الرقم القومي مسجّل بالفعل لسائق آخر.',
      date: 'أدخل تاريخًا صحيحًا.',
      amount: 'أدخل المبلغ بالأرقام فقط، مثل 5000 أو 5000.50',
      load: 'تعذّر تحميل السائقين. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    list: {
      title: 'السائقون',
      add: 'إضافة سائق',
      hint: 'السائقون الذين يعملون معك في نقل الموظفين.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي سائق بعد. ابدأ بإضافة أول سائق.',
      fullName: 'الاسم',
      phone: 'رقم الموبايل',
      nationalId: 'الرقم القومي',
      licenseNumber: 'رقم الرخصة',
      licenseExpiry: 'انتهاء الرخصة',
      expired: 'منتهية',
      work: 'الحالة',
      working: 'يعمل',
      stopped: 'موقوف',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة سائق جديد',
      editTitle: 'تعديل بيانات السائق',
      fullName: 'اسم السائق',
      fullNameHint: 'الاسم كما في البطاقة، مثل: أحمد محمد علي.',
      phone: 'رقم الموبايل',
      nationalId: 'الرقم القومي',
      nationalIdHint: 'الرقم المكتوب في بطاقة الهوية.',
      licenseNumber: 'رقم رخصة القيادة',
      licenseExpiry: 'تاريخ انتهاء رخصة القيادة',
      licenseExpiryHint: 'تظهر كلمة "منتهية" في القائمة بعد هذا التاريخ.',
      payTitle: 'أجر السائق',
      payHint:
        'يُستخدم لحساب راتب السائق المقترح في صفحة المصاريف كل شهر: الراتب الثابت + مبلغ الرحلة × عدد الرحلات التي تمّت. اترك ما لا ينطبق فارغًا.',
      monthlySalary: 'الراتب الشهري الثابت',
      amountHint: 'بالأرقام فقط، مثل 5000 أو 5000.50',
      tripPay: 'مبلغ لكل رحلة',
      tripPayHint: 'ما يأخذه السائق عن كل رحلة ذهاب أو عودة تمّت.',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذا السائق.',
      active: 'السائق يعمل حاليًا',
      add: 'إضافة السائق',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة السائق.',
      saved: 'تم حفظ التعديلات.',
    },
  },
  en: {
    problems: {
      name: 'Enter the driver name.',
      tooLong: 'This text is too long.',
      nationalId: 'The national ID can contain only digits and English letters.',
      nationalIdTaken: 'This national ID is already used by another driver.',
      date: 'Enter a valid date.',
      amount: 'Enter the amount in digits only, like 5000 or 5000.50',
      load: 'Could not load your drivers. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    list: {
      title: 'Drivers',
      add: 'Add driver',
      hint: 'The drivers who work with you transporting staff.',
      loading: 'Loading...',
      empty: 'You have not added any driver yet. Start by adding the first one.',
      fullName: 'Name',
      phone: 'Mobile',
      nationalId: 'National ID',
      licenseNumber: 'License number',
      licenseExpiry: 'License expiry',
      expired: 'Expired',
      work: 'Status',
      working: 'Working',
      stopped: 'Stopped',
      edit: 'Edit',
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
      licenseExpiryHint: 'The list shows "Expired" after this date.',
      payTitle: 'Driver pay',
      payHint:
        "Used to suggest the driver's salary each month on the expenses page: the fixed salary + the trip amount × the trips done. Leave blank what does not apply.",
      monthlySalary: 'Fixed monthly salary',
      amountHint: 'Digits only, like 5000 or 5000.50',
      tripPay: 'Amount per trip',
      tripPayHint: 'What the driver earns for each outbound or return trip done.',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this driver.',
      active: 'This driver is currently working',
      add: 'Add driver',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The driver was added.',
      saved: 'Your changes were saved.',
    },
  },
};
