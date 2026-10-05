import { Language } from '@routeops/shared/i18n';
import { ShellSection } from './shell-sections';

export interface ShellText {
  readonly navigation: string;
  readonly openMenu: string;
  readonly closeMenu: string;
  readonly home: string;
  readonly signOut: string;
  readonly sections: Record<ShellSection, string>;
}

export const shellText: Record<Language, ShellText> = {
  ar: {
    navigation: 'القائمة الرئيسية',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    home: 'الرئيسية',
    signOut: 'تسجيل الخروج',
    sections: {
      operations: 'التشغيل اليومي',
      routes: 'الخطوط',
      customers: 'الشركات المتعاقدة',
      vehicles: 'المركبات',
      drivers: 'السائقون',
      reports: 'التقارير',
    },
  },
  en: {
    navigation: 'Main menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    home: 'Home',
    signOut: 'Sign out',
    sections: {
      operations: 'Daily operations',
      routes: 'Routes',
      customers: 'Client companies',
      vehicles: 'Vehicles',
      drivers: 'Drivers',
      reports: 'Reports',
    },
  },
};
