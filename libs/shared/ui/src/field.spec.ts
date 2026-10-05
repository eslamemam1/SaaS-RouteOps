import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { LanguageService } from '@routeops/shared/i18n';
import { Field } from './field';
import { uiText } from './ui-text';

@Component({
  imports: [Field, FormField],
  template: `
    <app-field
      label="Route name"
      hint="The name drivers know"
      [optional]="optional()"
      [control]="routeForm.name"
    >
      <input type="text" [formField]="routeForm.name" />
    </app-field>
  `,
})
class Host {
  readonly optional = signal(false);
  readonly model = signal({ name: '' });
  readonly routeForm = form(this.model, (path) => {
    required(path.name, { message: 'Write the route name.' });
  });
}

describe('Field', () => {
  beforeEach(() => localStorage.clear());

  it('shows the error of its form field only after the field was touched', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-field-error')).toBeNull();

    fixture.componentInstance.routeForm.name().markAsTouched();
    await fixture.whenStable();

    expect(element.querySelector('.app-field-error')?.textContent).toContain(
      'Write the route name.',
    );
    expect(element.querySelector('app-field')?.classList).toContain('app-field-invalid');
  });

  it('marks an optional field in the current language', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.optional.set(true);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(uiText.ar.optional);

    TestBed.inject(LanguageService).setLanguage('en');
    await fixture.whenStable();

    expect(element.textContent).toContain(uiText.en.optional);
  });
});
