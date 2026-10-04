import { Component, computed, inject } from '@angular/core';
import { LanguageService } from './language';

@Component({
  selector: 'app-language-switch',
  template: `
    <button type="button" [attr.lang]="otherLanguage()" (click)="toggle()">
      {{ label() }}
    </button>
  `,
})
export class LanguageSwitch {
  private readonly languages = inject(LanguageService);

  protected readonly otherLanguage = computed(() =>
    this.languages.language() === 'ar' ? 'en' : 'ar',
  );
  protected readonly label = computed(() =>
    this.otherLanguage() === 'en' ? 'English' : 'العربية',
  );

  protected toggle(): void {
    this.languages.setLanguage(this.otherLanguage());
  }
}
