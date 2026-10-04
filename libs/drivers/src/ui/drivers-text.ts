import { Language } from '@routeops/shared/i18n';
import { DriverProblem } from '../domain/driver';

export interface DriversText {
  readonly problems: Record<DriverProblem, string>;
  readonly list: {
    readonly back: string;
    readonly title: string;
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
      load: 'تعذّر تحميل السائقين. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    list: {
      back: 'الرجوع إلى الصفحة الرئيسية',
      title: 'السائقون',
      hint: 'السائقون الذين يعملون معك في نقل الموظفين.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي سائق بعد. ابدأ بإضافة أول سائق من النموذج بالأسفل.',
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
      phone: 'رقم الموبايل (اختياري)',
      nationalId: 'الرقم القومي (اختياري)',
      nationalIdHint: 'الرقم المكتوب في بطاقة الهوية.',
      licenseNumber: 'رقم رخصة القيادة (اختياري)',
      licenseExpiry: 'تاريخ انتهاء رخصة القيادة (اختياري)',
      licenseExpiryHint: 'تظهر كلمة "منتهية" في القائمة بعد هذا التاريخ.',
      notes: 'ملاحظات (اختياري)',
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
      load: 'Could not load your drivers. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    list: {
      back: 'Back to home',
      title: 'Drivers',
      hint: 'The drivers who work with you transporting staff.',
      loading: 'Loading...',
      empty: 'You have not added any driver yet. Add the first one using the form below.',
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
      phone: 'Mobile number (optional)',
      nationalId: 'National ID (optional)',
      nationalIdHint: 'The number written on the ID card.',
      licenseNumber: 'Driving license number (optional)',
      licenseExpiry: 'Driving license expiry date (optional)',
      licenseExpiryHint: 'The list shows "Expired" after this date.',
      notes: 'Notes (optional)',
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
