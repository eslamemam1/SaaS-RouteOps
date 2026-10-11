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

export const productName: Record<Language, string> = {
  ar: 'حركة',
  en: 'Haraka',
};

const storageKey = 'routeops.language';

@Service()
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Language>(
    readStoredLanguage(this.document),
  );

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
  return formatDate(`${month}-01`, language, {
    month: 'long',
    year: 'numeric',
  });
}

// The weekday of a day stored as YYYY-MM-DD, as short as a calendar heads its
// columns with, such as س in Arabic or Sat in English.
export function formatWeekdayShort(day: string, language: Language): string {
  return formatDate(day, language, {
    weekday: language === 'ar' ? 'narrow' : 'short',
  });
}

// Only the name of a month stored as YYYY-MM, such as أكتوبر.
export function formatMonthName(month: string, language: Language): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }
  return formatDate(`${month}-01`, language, { month: 'long' });
}

// A time stored as HH:MM or HH:MM:SS, on a 12-hour clock, such as 7:30 ص or 7:30 PM.
export function formatTime(time: string, language: Language): string {
  const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(time);
  if (!match) {
    return time;
  }
  const hours = Number(match[1]);
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  const period = hours < 12 ? dayPeriods[language].am : dayPeriods[language].pm;
  return `${hour}:${match[2]} ${period}`;
}

const dayPeriods: Record<
  Language,
  { readonly am: string; readonly pm: string }
> = {
  ar: { am: 'ص', pm: 'م' },
  en: { am: 'AM', pm: 'PM' },
};

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
  return new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
    {
      ...options,
      timeZone: 'UTC',
    },
  ).format(new Date(`${day}T00:00:00Z`));
}
