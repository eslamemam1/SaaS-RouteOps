import { Language } from '@routeops/shared/i18n';
import { DriverProblem, PayType } from '../domain/driver';

export interface DriversText {
  readonly problems: Record<DriverProblem, string>;
  readonly payTypes: Record<PayType, string>;
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
    readonly payType: string;
    readonly monthlySalary: string;
    readonly amountHint: string;
    readonly salaryTrips: string;
    readonly salaryTripsHint: string;
    readonly extraPayHint: string;
    readonly perTripHint: string;
    readonly outboundPay: string;
    readonly returnPay: string;
    readonly notes: string;
    readonly notesHint: string;
    readonly photo: string;
    readonly optional: string;
    readonly photoHint: string;
    readonly choosePhoto: string;
    readonly changePhoto: string;
    readonly removePhoto: string;
    readonly active: string;
    readonly activeHint: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly added: string;
    readonly saved: string;
    readonly photoFailed: string;
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
      required: 'هذه الخانة مطلوبة.',
      trips: 'اكتب عدد الرحلات بالأرقام فقط، مثل 26.',
      photo: 'تعذّر فتح هذه الصورة. اختر صورة بصيغة JPG أو PNG أو WebP.',
      activeRoutes: 'لا يمكن إيقاف هذا السائق لأنه سائق هذه الخطوط العاملة. اختر لها سائقًا آخر أو أوقفها من صفحة الخطوط أولًا:',
      load: 'تعذّر تحميل السائقين. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    payTypes: {
      none: 'لم يُحدَّد بعد',
      salary: 'موظف براتب شهري',
      perTrip: 'يعمل بالرحلة',
    },
    list: {
      title: 'السائقون',
      add: 'إضافة سائق',
      hint: 'السائقون الذين يعملون معك في نقل الموظفين.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي سائق بعد. ابدأ بإضافة أول سائق.',
      fullName: 'الاسم',
      phone: 'رقم الهاتف المحمول',
      nationalId: 'الرقم القومي',
      licenseNumber: 'رقم الرخصة',
      licenseExpiry: 'انتهاء الرخصة',
      expired: 'منتهية',
      work: 'الحالة',
      working: 'يعمل',
      stopped: 'لا يعمل حاليًا',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة سائق جديد',
      editTitle: 'تعديل بيانات السائق',
      fullName: 'اسم السائق',
      fullNameHint: 'الاسم كما في البطاقة، مثل: أحمد محمد علي.',
      phone: 'رقم الهاتف المحمول',
      nationalId: 'الرقم القومي',
      nationalIdHint: 'الرقم المكتوب في بطاقة الهوية.',
      licenseNumber: 'رقم رخصة القيادة',
      licenseExpiry: 'تاريخ انتهاء رخصة القيادة',
      licenseExpiryHint: 'تظهر كلمة "منتهية" في القائمة بعد هذا التاريخ.',
      payTitle: 'أجر السائق',
      payHint:
        'يُستخدم لحساب راتب السائق المقترح كل شهر في صفحة المصاريف من الرحلات التي قادها فعلًا، ويمكنك تعديل المبلغ قبل تسجيله. أي تغيير هنا يسري من الشهر الحالي، وتبقى الشهور السابقة على حسابها القديم.',
      payType: 'طريقة حساب الأجر',
      monthlySalary: 'الراتب الشهري',
      amountHint: 'بالأرقام فقط، مثل 5000 أو 5000.50',
      salaryTrips: 'الراتب يغطي كم رحلة ذهاب وعودة في الشهر؟',
      salaryTripsHint:
        'مثال: 26 تعني 26 رحلة ذهاب و26 رحلة عودة. إذا قاد أكثر يأخذ عن كل رحلة إضافية، وإذا غاب يُخصم منه عن كل رحلة. اتركه فارغًا إذا كان راتبه ثابتًا مهما كان عدد رحلاته.',
      extraPayHint:
        'المبلغ عن كل رحلة إضافية فوق العدد، ويُخصم المبلغ نفسه عن كل رحلة غاب عنها.',
      perTripHint: 'يأخذ مبلغًا عن كل رحلة يقودها.',
      outboundPay: 'مبلغ رحلة الذهاب',
      returnPay: 'مبلغ رحلة العودة',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذا السائق.',
      photo: 'صورة السائق',
      optional: '(اختياري)',
      photoHint:
        'تُصغَّر الصورة تلقائيًا قبل رفعها، فلا تشغل إلا مساحة صغيرة جدًا.',
      choosePhoto: 'اختيار صورة',
      changePhoto: 'تغيير الصورة',
      removePhoto: 'إزالة الصورة',
      active: 'السائق يعمل حاليًا',
      activeHint: 'لا يظهر السائق الموقوف عند اختيار سائق لخط أو رحلة، وتبقى رحلاته ورواتبه السابقة كما هي.',
      add: 'إضافة السائق',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة السائق.',
      saved: 'تم حفظ التعديلات.',
      photoFailed:
        'تم حفظ بيانات السائق، لكن تعذّر رفع الصورة. افتح تعديل السائق وحاول مرة أخرى.',
    },
  },
  en: {
    problems: {
      name: 'Enter the driver name.',
      tooLong: 'This text is too long.',
      nationalId:
        'The national ID can contain only digits and English letters.',
      nationalIdTaken: 'This national ID is already used by another driver.',
      date: 'Enter a valid date.',
      amount: 'Enter the amount in digits only, like 5000 or 5000.50',
      required: 'This field is required.',
      trips: 'Enter the number of trips in digits only, like 26.',
      photo:
        'This photo could not be opened. Choose a JPG, PNG, or WebP photo.',
      activeRoutes: 'This driver cannot be made inactive because they drive these active routes. Give them another driver or stop them on the routes page first:',
      load: 'Could not load your drivers. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    payTypes: {
      none: 'Not set yet',
      salary: 'Employee with a monthly salary',
      perTrip: 'Paid per trip',
    },
    list: {
      title: 'Drivers',
      add: 'Add driver',
      hint: 'The drivers who work with you transporting staff.',
      loading: 'Loading...',
      empty:
        'You have not added any driver yet. Start by adding the first one.',
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
        "Used to suggest the driver's salary each month on the expenses page from the trips the driver actually drove, and you can change the amount before recording it. A change here applies from the current month; past months keep their old terms.",
      payType: 'How is the driver paid?',
      monthlySalary: 'Monthly salary',
      amountHint: 'Digits only, like 5000 or 5000.50',
      salaryTrips:
        'How many outbound and return trips does the salary cover each month?',
      salaryTripsHint:
        'Example: 26 means 26 outbound and 26 return trips. Each trip beyond them earns extra, and each trip missed through absence is taken off. Leave it blank if the salary is fixed whatever the driver does.',
      extraPayHint:
        'What each trip beyond that number earns; the same amount is taken off for each trip missed through absence.',
      perTripHint: 'What the driver earns for each trip.',
      outboundPay: 'Outbound trip amount',
      returnPay: 'Return trip amount',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this driver.',
      photo: 'Driver photo',
      optional: '(optional)',
      photoHint:
        'The photo is shrunk automatically before upload, so it takes very little space.',
      choosePhoto: 'Choose a photo',
      changePhoto: 'Change photo',
      removePhoto: 'Remove photo',
      active: 'This driver is currently working',
      activeHint: 'An inactive driver is not offered for routes or trips, and their past trips and pay stay as they are.',
      add: 'Add driver',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The driver was added.',
      saved: 'Your changes were saved.',
      photoFailed:
        'The driver was saved, but the photo could not be uploaded. Open the driver and try again.',
    },
  },
};
