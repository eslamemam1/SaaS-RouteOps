import { Language } from '@routeops/shared/i18n';
import { CustomerProblem } from '../domain/customer';

export interface CustomersText {
  readonly problems: Record<CustomerProblem, string>;
  readonly list: {
    readonly title: string;
    readonly add: string;
    readonly hint: string;
    readonly loading: string;
    readonly empty: string;
    readonly name: string;
    readonly contactName: string;
    readonly phone: string;
    readonly email: string;
    readonly address: string;
    readonly dealing: string;
    readonly current: string;
    readonly stopped: string;
    readonly edit: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly name: string;
    readonly nameHint: string;
    readonly contactName: string;
    readonly contactNameHint: string;
    readonly phone: string;
    readonly email: string;
    readonly address: string;
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

export const customersText: Record<Language, CustomersText> = {
  ar: {
    problems: {
      name: 'أدخل اسم الشركة أو المصنع.',
      tooLong: 'النص أطول من المسموح.',
      emailFormat: 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@company.com',
      load: 'تعذّر تحميل الشركات المتعاقدة. حاول مرة أخرى.',
      save: 'تعذّر حفظ البيانات. حاول مرة أخرى.',
      organization: 'لا يمكنك فتح هذه الصفحة من حسابك.',
      signedOut: 'سجّل الدخول للمتابعة.',
      notConnected: 'التطبيق غير متصل بقاعدة البيانات.',
    },
    list: {
      title: 'الشركات المتعاقدة',
      add: 'إضافة شركة',
      hint: 'الشركات والمصانع التي تنقل موظفيها. سجّل هنا كل شركة تتعامل معها.',
      loading: 'جارٍ التحميل...',
      empty: 'لم تضف أي شركة بعد. ابدأ بإضافة أول شركة.',
      name: 'الشركة أو المصنع',
      contactName: 'المسؤول عندهم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      dealing: 'التعامل',
      current: 'مستمر',
      stopped: 'متوقف',
      edit: 'تعديل',
    },
    form: {
      addTitle: 'إضافة شركة متعاقدة جديدة',
      editTitle: 'تعديل بيانات الشركة',
      name: 'اسم الشركة أو المصنع',
      nameHint: 'الشركة التي تنقل موظفيها، مثل: مصنع الدلتا للنسيج.',
      contactName: 'اسم المسؤول عندهم',
      contactNameHint:
        'الشخص الذي تتواصل معه في هذه الشركة، مثل مدير شؤون الموظفين.',
      phone: 'رقم هاتف المسؤول',
      email: 'البريد الإلكتروني للمسؤول',
      address: 'عنوان الشركة أو المصنع',
      notes: 'ملاحظات',
      notesHint: 'أي معلومة تريد تذكّرها عن هذه الشركة.',
      active: 'ما زلنا نتعامل مع هذه الشركة',
      add: 'إضافة الشركة',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      added: 'تمت إضافة الشركة.',
      saved: 'تم حفظ التعديلات.',
    },
  },
  en: {
    problems: {
      name: 'Enter the company or factory name.',
      tooLong: 'This text is too long.',
      emailFormat: 'Enter a valid email, like name@company.com',
      load: 'Could not load your client companies. Please try again.',
      save: 'Could not save. Please try again.',
      organization: 'You cannot open this page from your account.',
      signedOut: 'Sign in to continue.',
      notConnected: 'The app is not connected to the database.',
    },
    list: {
      title: 'Client companies',
      add: 'Add company',
      hint: 'The companies and factories whose staff you transport. Add every company you work with here.',
      loading: 'Loading...',
      empty: 'You have not added any company yet. Start by adding the first one.',
      name: 'Company or factory',
      contactName: 'Their contact person',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      dealing: 'Status',
      current: 'Current',
      stopped: 'Stopped',
      edit: 'Edit',
    },
    form: {
      addTitle: 'Add a new client company',
      editTitle: 'Edit company details',
      name: 'Company or factory name',
      nameHint: 'The company whose staff you transport, e.g. Delta Textile Factory.',
      contactName: 'Their contact person',
      contactNameHint:
        'The person you deal with at this company, e.g. the HR manager.',
      phone: 'Contact phone',
      email: 'Contact email',
      address: 'Company or factory address',
      notes: 'Notes',
      notesHint: 'Anything you want to remember about this company.',
      active: 'We still work with this company',
      add: 'Add company',
      save: 'Save changes',
      cancel: 'Cancel',
      added: 'The company was added.',
      saved: 'Your changes were saved.',
    },
  },
};
