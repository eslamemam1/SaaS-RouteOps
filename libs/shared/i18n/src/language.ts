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
