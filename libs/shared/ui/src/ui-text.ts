import { Language } from '@routeops/shared/i18n';

export interface UiText {
  readonly optional: string;
  readonly close: string;
}

export const uiText: Record<Language, UiText> = {
  ar: { optional: '(اختياري)', close: 'إغلاق' },
  en: { optional: '(optional)', close: 'Close' },
};
