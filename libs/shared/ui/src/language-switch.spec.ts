import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectText } from '@routeops/shared/i18n';
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
