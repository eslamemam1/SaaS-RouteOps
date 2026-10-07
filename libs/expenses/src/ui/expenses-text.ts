import { Language } from '@routeops/shared/i18n';
import { ExpenseCategory, ExpenseProblem, PayType, RentType } from '../domain/expense';

export interface ExpensesText {
  readonly problems: Record<ExpenseProblem, string>;
  readonly categories: Record<ExpenseCategory, string>;
  readonly list: {
    readonly title: string;
    readonly hint: string;
    readonly add: string;
    readonly loading: string;
    readonly empty: string;
    readonly month: string;
    readonly previous: string;
    readonly next: string;
    readonly thisMonth: string;
    readonly total: string;
    readonly count: string;
    readonly unrecordedPay: string;
    readonly byCategory: string;
    readonly expensesTitle: string;
    readonly noExpenses: string;
    readonly date: string;
    readonly category: string;
    readonly description: string;
    readonly vehicle: string;
    readonly driver: string;
    readonly amount: string;
    readonly edit: string;
  };
  readonly pay: {
    readonly payTypes: Record<PayType, string>;
    readonly title: string;
    readonly hint: string;
    readonly absenceHint: string;
    readonly none: string;
    readonly driversLink: string;
    readonly driver: string;
    readonly trips: string;
    readonly outbound: string;
    readonly return: string;
    readonly covered: string;
    readonly fixed: string;
    readonly absent: string;
    readonly breakdown: string;
    readonly salaryPart: string;
    readonly extraPart: string;
    readonly tripsPart: string;
    readonly missedPart: string;
    readonly suggested: string;
    readonly recorded: string;
    readonly remaining: string;
    readonly record: string;
    readonly done: string;
    readonly noteSalary: string;
    readonly notePay: string;
  };
  readonly rent: {
    readonly rentTypes: Record<RentType, string>;
    readonly title: string;
    readonly hint: string;
    readonly none: string;
    readonly vehiclesLink: string;
    readonly vehicle: string;
    readonly trips: string;
    readonly suggested: string;
    readonly recorded: string;
    readonly remaining: string;
    readonly record: string;
    readonly done: string;
    readonly note: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly spentOn: string;
    readonly category: string;
    readonly chooseCategory: string;
    readonly amount: string;
    readonly amountHint: string;
    readonly vehicle: string;
    readonly vehicleHint: string;
    readonly driver: string;
    readonly driverHint: string;
    readonly none: string;
    readonly description: string;
    readonly descriptionHint: string;
    readonly add: string;
    readonly save: string;
    readonly cancel: string;
    readonly remove: string;
    readonly confirmRemove: string;
    readonly added: string;
    readonly saved: string;
    readonly removed: string;
  };
}

export const expensesText: Record<Language, ExpensesText> = {
  ar: {
    problems: {
      date: 'اختر تاريخ المصروف.',
      category: 'اختر نوع المصروف.',
      amount: 'أدخل مبلغًا أكبر من صفر بالأرقام فقط، مثل 250 أو 250.50',
      description: 'اكتب وصفًا قصيرًا لهذا المصروف.',
      tooLong: 'النص أطول من المسموح.',
      load: 'تعذّر تحميل المصاريف. حاول مرة أخرى.',
      save: 'تعذّر حفظ المصروف. حاول مرة أخرى.',
      remove: 'تعذّر حذف المصروف. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    categories: {
      fuel: 'وقود',
      maintenance: 'صيانة وقطع غيار',
      salaries: 'رواتب وأجور',
      rent: 'إيجار مركبات',
      contractors: 'مستحقات المقاولين',
      licenses: 'تراخيص وتأمين',
      tolls: 'رسوم طرق وكارتة',
      office: 'مصاريف إدارية',
      other: 'أخرى',
    },
    list: {
      title: 'المصاريف',
      hint: 'كل ما تصرفه الشركة في الشهر، مثل الوقود والصيانة والرواتب وإيجار المركبات. تظهر في التقارير لحساب صافي الربح.',
      add: 'إضافة مصروف',
      loading: 'جارٍ التحميل...',
      empty: 'لم تسجّل أي مصروف في هذا الشهر.',
      month: 'الشهر',
      previous: 'الشهر السابق',
      next: 'الشهر التالي',
      thisMonth: 'هذا الشهر',
      total: 'إجمالي مصاريف الشهر',
      count: 'عدد المصاريف',
      unrecordedPay: 'رواتب وأجرة مقترحة لم تُسجّل',
      byCategory: 'المصاريف حسب النوع',
      expensesTitle: 'مصاريف الشهر',
      noExpenses: 'لا توجد مصاريف مسجّلة في هذا الشهر بعد.',
      date: 'التاريخ',
      category: 'النوع',
      description: 'الوصف',
      vehicle: 'المركبة',
      driver: 'السائق',
      amount: 'المبلغ',
      edit: 'تعديل',
    },
    pay: {
      payTypes: {
        salary: 'موظف براتب',
        perTrip: 'بالرحلة',
      },
      title: 'رواتب السائقين',
      hint: 'الموظف يأخذ راتبه، وعن كل رحلة زيادة على العدد الذي يغطيه الراتب يأخذ مبلغها. ومن يعمل بالرحلة يأخذ عن كل رحلة طلعها. لا يُحسب الراتب مصروفًا حتى تسجّله، ويمكنك تعديل المبلغ قبل التسجيل.',
      absenceHint: 'يُخصم من الموظف فقط عن رحلات خطه التي غيّرتها أو ألغيتها في التشغيل اليومي بسبب "غياب السائق"، وبشرط ألا يكمل العدد الذي يغطيه الراتب. الإجازات وأعطال المركبات لا تُخصم.',
      none: 'لتظهر هنا رواتب السائقين المقترحة كل شهر، حدّد في صفحة السائقين كيف يتحاسب كل سائق.',
      driversLink: 'فتح صفحة السائقين',
      driver: 'السائق',
      trips: 'الرحلات التي طلعها',
      outbound: 'ذهاب',
      return: 'عودة',
      covered: 'يغطيها الراتب:',
      fixed: 'راتب ثابت',
      absent: 'غاب عن:',
      breakdown: 'الحساب',
      salaryPart: 'الراتب',
      extraPart: 'رحلات زيادة',
      tripsPart: 'الرحلات',
      missedPart: 'خصم غياب',
      suggested: 'المقترح',
      recorded: 'المسجَّل',
      remaining: 'المتبقي',
      record: 'تسجيل الراتب',
      done: 'مسجَّل بالكامل',
      noteSalary: 'راتب',
      notePay: 'أجر',
    },
    rent: {
      rentTypes: {
        monthly: 'شهري ثابت',
        perTrip: 'بالرحلة',
      },
      title: 'أجرة المركبات',
      hint: 'أجرة المركبات المؤجّرة ومركبات المتعاقدين: المبلغ الشهري، أو عدد رحلات المركبة في مبلغ كل رحلة. لا تُحسب مصروفًا حتى تسجّلها، ويمكنك تعديل المبلغ قبل التسجيل.',
      none: 'لتظهر هنا أجرة المركبات المؤجّرة ومركبات المتعاقدين كل شهر، حدّد في صفحة المركبات كيف يتحاسب صاحب كل مركبة.',
      vehiclesLink: 'فتح صفحة المركبات',
      vehicle: 'المركبة',
      trips: 'الرحلات التي طلعتها',
      suggested: 'المقترح',
      recorded: 'المسجَّل',
      remaining: 'المتبقي',
      record: 'تسجيل الأجرة',
      done: 'مسجَّلة بالكامل',
      note: 'أجرة',
    },
    form: {
      addTitle: 'إضافة مصروف',
      editTitle: 'تعديل المصروف',
      spentOn: 'تاريخ المصروف',
      category: 'نوع المصروف',
      chooseCategory: 'اختر النوع',
      amount: 'المبلغ',
      amountHint: 'بالأرقام فقط، مثل 250 أو 250.50',
      vehicle: 'المركبة',
      vehicleHint: 'اختر المركبة إذا صُرف المبلغ عليها، مثل الوقود والصيانة وإيجارها، ليظهر في ربح كل مركبة في التقارير.',
      driver: 'السائق',
      driverHint: 'اختر السائق إذا صُرف المبلغ له، مثل راتبه.',
      none: 'بدون',
      description: 'الوصف',
      descriptionHint: 'مثل: تغيير زيت، أو إيجار شهر أكتوبر. مطلوب عند اختيار "أخرى".',
      add: 'إضافة المصروف',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      remove: 'حذف المصروف',
      confirmRemove: 'اضغط مرة أخرى لتأكيد الحذف',
      added: 'تمت إضافة المصروف.',
      saved: 'تم حفظ التعديلات.',
      removed: 'تم حذف المصروف.',
    },
  },
  en: {
    problems: {
      date: 'Choose the expense date.',
      category: 'Choose the expense type.',
      amount: 'Enter an amount above zero in digits only, like 250 or 250.50',
      description: 'Write a short description of this expense.',
      tooLong: 'This text is too long.',
      load: 'Could not load your expenses. Please try again.',
      save: 'Could not save the expense. Please try again.',
      remove: 'Could not delete the expense. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    categories: {
      fuel: 'Fuel',
      maintenance: 'Maintenance and parts',
      salaries: 'Salaries and wages',
      rent: 'Vehicle rent',
      contractors: 'Contractor payments',
      licenses: 'Licenses and insurance',
      tolls: 'Road tolls',
      office: 'Office costs',
      other: 'Other',
    },
    list: {
      title: 'Expenses',
      hint: 'Everything the company spends in the month, such as fuel, maintenance, salaries, and vehicle rent. Reports use them to show net profit.',
      add: 'Add expense',
      loading: 'Loading...',
      empty: 'You have not recorded any expense this month.',
      month: 'Month',
      previous: 'Previous month',
      next: 'Next month',
      thisMonth: 'This month',
      total: 'Total expenses this month',
      count: 'Expenses recorded',
      unrecordedPay: 'Suggested salaries and vehicle pay not recorded',
      byCategory: 'Expenses by type',
      expensesTitle: 'This month’s expenses',
      noExpenses: 'No expenses recorded this month yet.',
      date: 'Date',
      category: 'Type',
      description: 'Description',
      vehicle: 'Vehicle',
      driver: 'Driver',
      amount: 'Amount',
      edit: 'Edit',
    },
    pay: {
      payTypes: {
        salary: 'Employee',
        perTrip: 'Per trip',
      },
      title: 'Driver salaries',
      hint: 'An employee gets the salary, plus the amount of each trip beyond the number the salary covers. A driver paid per trip gets each trip done. A salary counts as an expense only after you record it, and you can change the amount before recording it.',
      absenceHint: 'An employee loses pay only for trips of their own routes that you changed or cancelled on the daily operations page because the driver was absent, and only below the number the salary covers. Holidays and vehicle breakdowns cost nothing.',
      none: 'To see suggested driver salaries here every month, set how each driver is paid on the drivers page.',
      driversLink: 'Open the drivers page',
      driver: 'Driver',
      trips: 'Trips done',
      outbound: 'Outbound',
      return: 'Return',
      covered: 'Salary covers:',
      fixed: 'Fixed salary',
      absent: 'Absent for:',
      breakdown: 'How it adds up',
      salaryPart: 'Salary',
      extraPart: 'Extra trips',
      tripsPart: 'Trips',
      missedPart: 'Absence',
      suggested: 'Suggested',
      recorded: 'Recorded',
      remaining: 'Remaining',
      record: 'Record salary',
      done: 'Fully recorded',
      noteSalary: 'Salary',
      notePay: 'Pay',
    },
    rent: {
      rentTypes: {
        monthly: 'Fixed monthly',
        perTrip: 'Per trip',
      },
      title: 'Vehicle pay',
      hint: 'Pay for rented and contractor vehicles: the monthly amount, or the vehicle\'s trips times each trip amount. It counts as an expense only after you record it, and you can change the amount before recording it.',
      none: 'To see the pay of rented and contractor vehicles here every month, set how each vehicle owner is paid on the vehicles page.',
      vehiclesLink: 'Open the vehicles page',
      vehicle: 'Vehicle',
      trips: 'Trips made',
      suggested: 'Suggested',
      recorded: 'Recorded',
      remaining: 'Remaining',
      record: 'Record pay',
      done: 'Fully recorded',
      note: 'Vehicle pay',
    },
    form: {
      addTitle: 'Add an expense',
      editTitle: 'Edit expense',
      spentOn: 'Expense date',
      category: 'Expense type',
      chooseCategory: 'Choose the type',
      amount: 'Amount',
      amountHint: 'Digits only, like 250 or 250.50',
      vehicle: 'Vehicle',
      vehicleHint: 'Choose the vehicle if the money was spent on it, such as fuel, maintenance, or its rent, so reports show each vehicle’s profit.',
      driver: 'Driver',
      driverHint: 'Choose the driver if the money was paid to them, such as their salary.',
      none: 'None',
      description: 'Description',
      descriptionHint: 'For example: oil change, or October rent. Required when the type is "Other".',
      add: 'Add expense',
      save: 'Save changes',
      cancel: 'Cancel',
      remove: 'Delete expense',
      confirmRemove: 'Press again to confirm',
      added: 'The expense was added.',
      saved: 'Your changes were saved.',
      removed: 'The expense was deleted.',
    },
  },
};
