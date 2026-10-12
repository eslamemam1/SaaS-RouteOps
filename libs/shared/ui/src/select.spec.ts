import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { Select, SelectOption } from './select';

@Component({
  imports: [Select, SelectOption],
  template: `
    <app-select
      [value]="city()"
      [disabled]="locked()"
      (valueChange)="city.set($event)"
    >
      <app-option value="" label="كل المدن" />
      @for (option of cities; track option.value) {
        <app-option [value]="option.value" [label]="option.label" />
      }
    </app-select>
  `,
})
class Filter {
  readonly cities = [
    { value: 'cairo', label: 'القاهرة' },
    { value: 'giza', label: 'الجيزة' },
    { value: 'alex', label: 'الإسكندرية' },
  ];
  readonly city = signal('');
  readonly locked = signal(false);
}

@Component({
  imports: [FormField, Select, SelectOption],
  template: `
    <app-select [formField]="tripForm.direction">
      <app-option value="outbound" label="ذهاب" />
      <app-option value="return" label="عودة" />
    </app-select>
  `,
})
class TripForm {
  readonly model = signal({ direction: 'outbound' });
  readonly tripForm = form(this.model);
}

describe('Select', () => {
  afterEach(() =>
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((item) => item.remove()),
  );

  it('shows the chosen label and chooses another from its list', async () => {
    const { fixture, element } = await render(Filter);
    expect(trigger(element).textContent?.trim()).toBe('كل المدن');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');

    trigger(element).click();
    await fixture.whenStable();

    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    expect(options().map((option) => option.textContent?.trim())).toEqual([
      'كل المدن',
      'القاهرة',
      'الجيزة',
      'الإسكندرية',
    ]);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');

    options()[2].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.city()).toBe('giza');
    expect(trigger(element).textContent?.trim()).toBe('الجيزة');
    expect(options()).toHaveLength(0);
  });

  it('moves through its list and chooses with the keyboard', async () => {
    const { fixture, element } = await render(Filter);

    press(element, 'ArrowDown');
    await fixture.whenStable();
    expect(options()).toHaveLength(4);
    expect(trigger(element).getAttribute('aria-activedescendant')).toBe(
      options()[0].id,
    );

    press(element, 'ArrowDown');
    press(element, 'ArrowDown');
    await fixture.whenStable();
    expect(trigger(element).getAttribute('aria-activedescendant')).toBe(
      options()[2].id,
    );

    press(element, 'End');
    press(element, 'Enter');
    await fixture.whenStable();

    expect(fixture.componentInstance.city()).toBe('alex');
    expect(options()).toHaveLength(0);
  });

  it('closes on Escape without choosing, and keeps the key from closing what holds it', async () => {
    const { fixture, element } = await render(Filter);
    const outer = vi.fn();
    element.addEventListener('keydown', outer);

    press(element, 'ArrowDown');
    await fixture.whenStable();
    press(element, 'ArrowDown');
    const escape = press(element, 'Escape');
    await fixture.whenStable();

    expect(options()).toHaveLength(0);
    expect(fixture.componentInstance.city()).toBe('');
    expect(escape.defaultPrevented).toBe(true);
    expect(outer).toHaveBeenCalledTimes(2);
  });

  it('jumps to a choice by its first letters, as a native select does', async () => {
    const { fixture, element } = await render(Filter);

    press(element, 'ا');
    press(element, 'ل');
    press(element, 'ج');
    await fixture.whenStable();

    expect(fixture.componentInstance.city()).toBe('giza');
  });

  it('does not open while disabled', async () => {
    const { fixture, element } = await render(Filter);
    fixture.componentInstance.locked.set(true);
    await fixture.whenStable();

    expect(trigger(element).disabled).toBe(true);
    press(element, 'ArrowDown');
    await fixture.whenStable();

    expect(options()).toHaveLength(0);
  });

  it('reads and writes a Signal Forms field', async () => {
    const { fixture, element } = await render(TripForm);
    expect(trigger(element).textContent?.trim()).toBe('ذهاب');

    trigger(element).click();
    await fixture.whenStable();
    options()[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.model().direction).toBe('return');
    expect(trigger(element).textContent?.trim()).toBe('عودة');
  });
});

async function render<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

function trigger(element: HTMLElement): HTMLButtonElement {
  return element.querySelector('.app-select-trigger') as HTMLButtonElement;
}

function options(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
}

function press(element: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  trigger(element).dispatchEvent(event);
  return event;
}
