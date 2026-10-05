import { Language } from '@routeops/shared/i18n';
import { VehicleOwnership, VehicleProblem, VehicleType } from '../domain/vehicle';

export interface VehiclesText {
  readonly problems: Record<VehicleProblem, string>;
  readonly types: Record<VehicleType, string>;
  readonly ownerships: Record<VehicleOwnership, string>;
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly filter: string;
    readonly allOwnerships: string;
    readonly noMatch: string;
    readonly plateNumber: string;
    readonly type: string;
    readonly ownership: string;
    readonly model: string;
    readonly year: string;
    readonly seats: string;
    readonly licenseExpiry: string;
    readonly expired: string;
    readonly service: string;
    readonly inService: string;
    readonly outOfService: string;
    readonly edit: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly plateNumber: string;
    readonly plateNumberHint: string;
    readonly type: string;
    readonly chooseType: string;
    readonly model: string;
    readonly modelHint: string;
    readonly year: string;
    readonly seats: string;
    readonly seatsHint: string;
    readonly licenseExpiry: string;
    readonly licenseExpiryHint: string;
    readonly ownership: string;
    readonly ownershipHint: string;
    readonly ownerName: string;
    readonly ownerNameHint: string;
    readonly ownerPhone: string;
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

export const vehiclesText: Record<Language, VehiclesText> = {
  ar: {
    problems: {
      plate: 'أدخل رقم اللوحة.',
      plateTaken: 'رقم اللوحة هذا مسجّل بالفعل لمركبة أخرى.',
      type: 'اختر نوع المركبة.',
      ownerName: 'اكتب اسم صاحب المركبة أو المكتب.',
      tooLong: 'النص أطول من المسموح.',
      year: 'أدخل سنة صحيحة من 1950 حتى العام القادم، مثل 2020.',
      seats: 'أدخل عدد مقاعد صحيحًا من 1 إلى 100.',
      date: 'أدخل تاريخًا صحيحًا.',
      load: 'تعذّر تحميل المركبات. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    types: {
      bus: 'أتوبيس',
      minibus: 'ميني باص',
      microbus: 'ميكروباص',
      car: 'سيارة ملاكي',
    },
    ownerships: {
      owned: 'ملك الشركة',
      rented: 'إيجار',
      contractor: 'متعاقد بمركبته',
    },
    list: {
      title: 'المركبات',
      add: 'إضافة مركبة',
      hint: 'الأتوبيسات والميكروباصات والسيارات التي تنقل بها الموظفين، سواء كانت ملكك أو إيجارًا أو تخص متعاقدًا يعمل معك.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي مركبة بعد. ابدأ بإضافة أول مركبة.',
      filter: 'عرض',
      allOwnerships: 'كل المركبات',
      noMatch: 'لا توجد مركبات من هذا النوع.',
      plateNumber: 'رقم اللوحة',
      type: 'النوع',
      ownership: 'الملكية',
      model: 'الموديل',
      year: 'سنة الصنع',
      seats: 'المقاعد',
      licenseExpiry: 'انتهاء الرخصة',
      expired: 'منتهية',
      service: 'الحالة',
      inService: 'في الخدمة',
      outOfService: 'خارج الخدمة',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة مركبة جديدة',
      editTitle: 'تعديل بيانات المركبة',
      plateNumber: 'رقم اللوحة',
      plateNumberHint: 'اكتبه كما هو مكتوب على اللوحة، مثل: أ ب ج 1234.',
      type: 'نوع المركبة',
      chooseType: 'اختر النوع',
      model: 'الماركة والموديل',
      modelHint: 'مثل: تويوتا هايس.',
      year: 'سنة الصنع',
      seats: 'عدد المقاعد',
      seatsHint: 'عدد الركاب الذين تتسع لهم المركبة.',
      licenseExpiry: 'تاريخ انتهاء الرخصة',
      licenseExpiryHint: 'تظهر كلمة "منتهية" في القائمة بعد هذا التاريخ.',
      ownership: 'ملكية المركبة',
      ownershipHint: 'إيجار: مركبة تستأجرها من صاحبها أو من مكتب. متعاقد بمركبته: شخص يعمل معك بمركبته.',
      ownerName: 'اسم صاحب المركبة أو المكتب',
      ownerNameHint: 'الشخص الذي تحاسبه على هذه المركبة.',
      ownerPhone: 'رقم موبايله',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذه المركبة.',
      active: 'المركبة في الخدمة',
      add: 'إضافة المركبة',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة المركبة.',
      saved: 'تم حفظ التعديلات.',
    },
  },
  en: {
    problems: {
      plate: 'Enter the plate number.',
      plateTaken: 'This plate number is already used by another vehicle.',
      type: 'Choose the vehicle type.',
      ownerName: "Enter the vehicle owner's or office's name.",
      tooLong: 'This text is too long.',
      year: 'Enter a valid year from 1950 to next year, e.g. 2020.',
      seats: 'Enter a seat count from 1 to 100.',
      date: 'Enter a valid date.',
      load: 'Could not load your vehicles. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    types: {
      bus: 'Bus',
      minibus: 'Minibus',
      microbus: 'Microbus',
      car: 'Car',
    },
    ownerships: {
      owned: 'Company owned',
      rented: 'Rented',
      contractor: 'Contractor vehicle',
    },
    list: {
      title: 'Vehicles',
      add: 'Add vehicle',
      hint: 'The buses, microbuses, and cars you use to transport staff, whether you own them, rent them, or a contractor brings them.',
      loading: 'Loading...',
      empty: 'You have not added any vehicle yet. Start by adding the first one.',
      filter: 'Show',
      allOwnerships: 'All vehicles',
      noMatch: 'There are no vehicles of this kind.',
      plateNumber: 'Plate number',
      type: 'Type',
      ownership: 'Ownership',
      model: 'Model',
      year: 'Year',
      seats: 'Seats',
      licenseExpiry: 'License expiry',
      expired: 'Expired',
      service: 'Status',
      inService: 'In service',
      outOfService: 'Out of service',
      edit: 'Edit',
    },
    form: {
      addTitle: 'Add a new vehicle',
      editTitle: 'Edit vehicle details',
      plateNumber: 'Plate number',
      plateNumberHint: 'Write it exactly as it appears on the plate.',
      type: 'Vehicle type',
      chooseType: 'Choose a type',
      model: 'Make and model',
      modelHint: 'e.g. Toyota Hiace.',
      year: 'Manufacture year',
      seats: 'Number of seats',
      seatsHint: 'How many passengers the vehicle carries.',
      licenseExpiry: 'License expiry date',
      licenseExpiryHint: 'The list shows "Expired" after this date.',
      ownership: 'Vehicle ownership',
      ownershipHint: 'Rented: a vehicle you rent from its owner or an office. Contractor vehicle: someone who works with you using their own vehicle.',
      ownerName: "Owner's or office's name",
      ownerNameHint: 'The person you settle with for this vehicle.',
      ownerPhone: 'Their mobile number',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this vehicle.',
      active: 'This vehicle is in service',
      add: 'Add vehicle',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The vehicle was added.',
      saved: 'Your changes were saved.',
    },
  },
};
