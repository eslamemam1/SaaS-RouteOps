import { Language } from '@routeops/shared/i18n';
import { ExpenseCategory, ExpenseProblem } from '../domain/expense';

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
    readonly title: string;
    readonly hint: string;
    readonly none: string;
    readonly driversLink: string;
    readonly driver: string;
    readonly trips: string;
    readonly suggested: string;
    readonly recorded: string;
    readonly remaining: string;
    readonly record: string;
    readonly done: string;
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
      unrecordedPay: 'رواتب مقترحة لم تُسجّل',
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
      title: 'رواتب السائقين',
      hint: 'الراتب المقترح = الراتب الثابت + مبلغ الرحلة × الرحلات التي تمّت هذا الشهر. لا يُحسب الراتب مصروفًا حتى تسجّله.',
      none: 'لتظهر هنا رواتب السائقين المقترحة كل شهر، أدخل أجر كل سائق في صفحة السائقين.',
      driversLink: 'فتح صفحة السائقين',
      driver: 'السائق',
      trips: 'الرحلات التي تمّت',
      suggested: 'الراتب المقترح',
      recorded: 'المسجَّل',
      remaining: 'المتبقي',
      record: 'تسجيل الراتب',
      done: 'مسجَّل بالكامل',
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
      unrecordedPay: 'Suggested salaries not recorded',
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
      title: 'Driver salaries',
      hint: 'Suggested salary = fixed salary + trip amount × trips done this month. A salary counts as an expense only after you record it.',
      none: 'To see suggested driver salaries here every month, enter each driver’s pay on the drivers page.',
      driversLink: 'Open the drivers page',
      driver: 'Driver',
      trips: 'Trips done',
      suggested: 'Suggested salary',
      recorded: 'Recorded',
      remaining: 'Remaining',
      record: 'Record salary',
      done: 'Fully recorded',
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
