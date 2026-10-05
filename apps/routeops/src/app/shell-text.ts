import { Language } from '@routeops/shared/i18n';
import { ShellSection } from './shell-sections';

export interface ShellText {
  readonly navigation: string;
  readonly home: string;
  readonly sections: Record<ShellSection, string>;
}

export const shellText: Record<Language, ShellText> = {
  ar: {
    navigation: 'القائمة الرئيسية',
    home: 'الرئيسية',
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
    home: 'Home',
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
