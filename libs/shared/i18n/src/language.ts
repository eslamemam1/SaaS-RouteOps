import {
  computed,
  DOCUMENT,
  inject,
  Service,
  Signal,
  signal,
} from '@angular/core';

export type Language = 'ar' | 'en';

export const defaultLanguage: Language = 'ar';

export const productName: Record<Language, string> = { ar: 'حركة', en: 'Haraka' };

const storageKey = 'routeops.language';

@Service()
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Language>(readStoredLanguage(this.document));

  readonly language = this.current.asReadonly();
  readonly direction = computed(() => directionOf(this.current()));

  constructor() {
    this.applyToPage(this.current());
  }

  setLanguage(language: Language): void {
    this.current.set(language);
    this.applyToPage(language);
    try {
      this.document.defaultView?.localStorage.setItem(storageKey, language);
    } catch {
      // Storage can be disabled; the choice then lasts until reload.
    }
  }

  private applyToPage(language: Language): void {
    const root = this.document.documentElement;
    root.lang = language;
    root.dir = directionOf(language);
    this.document.title = productName[language];
  }
}

export function injectText<T>(dictionary: Record<Language, T>): Signal<T> {
  const language = inject(LanguageService).language;
  return computed(() => dictionary[language()]);
}

function directionOf(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

function readStoredLanguage(document: Document): Language {
  try {
    const stored = document.defaultView?.localStorage.getItem(storageKey);
    return stored === 'en' || stored === 'ar' ? stored : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}

// A day stored as YYYY-MM-DD, written as people read it, such as
// 11 أكتوبر 2026, with Latin digits as the rest of the interface uses.
export function formatDay(day: string, language: Language): string {
  return formatDate(day, language, fullDate);
}

// The same, led by the weekday, such as الأحد، 11 أكتوبر 2026.
export function formatDayWithWeekday(day: string, language: Language): string {
  return formatDate(day, language, { weekday: 'long', ...fullDate });
}

// A day of a month the page already names, such as الأحد، 11.
export function formatWeekdayAndDay(day: string, language: Language): string {
  return formatDate(day, language, { weekday: 'long', day: 'numeric' });
}

// A month stored as YYYY-MM, such as أكتوبر 2026.
export function formatMonth(month: string, language: Language): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }
  return formatDate(`${month}-01`, language, { month: 'long', year: 'numeric' });
}

const fullDate: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

function formatDate(
  day: string,
  language: Language,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return day;
  }
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}
