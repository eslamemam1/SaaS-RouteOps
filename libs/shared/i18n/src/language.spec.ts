import { Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectText, LanguageService } from './language';
import { LanguageSwitch } from './language-switch';

const greeting = { ar: { hello: 'مرحبًا' }, en: { hello: 'Hello' } };

@Component({
  selector: 'app-greeting',
  imports: [LanguageSwitch],
  template: `<p>{{ text().hello }}</p><app-language-switch />`,
})
class Greeting {
  protected readonly text = injectText(greeting);
}

describe('LanguageService', () => {
  beforeEach(() => localStorage.clear());

  it('starts in Arabic, right to left', () => {
    TestBed.inject(LanguageService);
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
  });

  it('switches the page to English, left to right, and remembers the choice', () => {
    TestBed.inject(LanguageService).setLanguage('en');
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(root.lang).toBe('en');
    expect(root.dir).toBe('ltr');
    expect(localStorage.getItem('routeops.language')).toBe('en');
  });

  it('restores the remembered language', () => {
    localStorage.setItem('routeops.language', 'en');

    expect(TestBed.inject(LanguageService).language()).toBe('en');
  });

  it('ignores an unknown remembered value', () => {
    localStorage.setItem('routeops.language', 'fr');

    expect(TestBed.inject(LanguageService).language()).toBe('ar');
  });
});

describe('LanguageSwitch', () => {
  beforeEach(() => localStorage.clear());

  it('changes the screen text when pressed', async () => {
    const fixture = TestBed.createComponent(Greeting);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('مرحبًا');
    expect(element.querySelector('button')?.textContent).toContain('English');

    element.querySelector('button')?.click();
    await fixture.whenStable();

    expect(element.textContent).toContain('Hello');
    expect(element.querySelector('button')?.textContent).toContain('العربية');
  });
});
