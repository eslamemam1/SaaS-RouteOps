import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { joinTime, TimePicker, timeParts } from './time-picker';

@Component({
  imports: [TimePicker],
  template: `<app-time-picker
    [value]="time()"
    (valueChange)="time.set($event)"
  />`,
})
class Departure {
  readonly time = signal('');
}

@Component({
  imports: [FormField, TimePicker],
  template: `<app-time-picker [formField]="tripForm.time" />`,
})
class TripForm {
  readonly model = signal({ time: '16:30:00' });
  readonly tripForm = form(this.model);
}

describe('TimePicker', () => {
  afterEach(() =>
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((item) => item.remove()),
  );

  it('splits and joins times on a 12-hour clock', () => {
    expect(timeParts('00:05')).toEqual({ hour: 12, minute: 5, period: 'am' });
    expect(timeParts('12:00:00')).toEqual({
      hour: 12,
      minute: 0,
      period: 'pm',
    });
    expect(timeParts('')).toEqual({ hour: null, minute: null, period: 'am' });
    expect(joinTime({ hour: 12, minute: 30, period: 'am' })).toBe('00:30');
    expect(joinTime({ hour: 7, minute: null, period: 'pm' })).toBe('19:00');
    expect(joinTime({ hour: null, minute: 15, period: 'pm' })).toBe('');
  });

  it('chooses an hour, a minute, and AM or PM from its columns', async () => {
    const { fixture, element } = await render(Departure);
    expect(trigger(element).textContent?.trim()).toBe('اختر الميعاد');

    trigger(element).click();
    await fixture.whenStable();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');

    option('minute', '45').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.time()).toBe('');

    option('hour', '7').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.time()).toBe('07:45');

    option('period', 'pm').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.time()).toBe('19:45');
    expect(trigger(element).textContent?.trim()).toBe('7:45 م');
  });

  it('closes with Escape and clears the time', async () => {
    const { fixture, element } = await render(Departure);
    fixture.componentInstance.time.set('08:00');
    await fixture.whenStable();

    trigger(element).click();
    await fixture.whenStable();
    expect(option('hour', '8').getAttribute('aria-selected')).toBe('true');
    option('hour', '8').dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    await fixture.whenStable();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');

    trigger(element).click();
    await fixture.whenStable();
    button('مسح الميعاد').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.time()).toBe('');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('reads and writes a Signal Forms field', async () => {
    const { fixture, element } = await render(TripForm);
    expect(trigger(element).textContent?.trim()).toBe('4:30 م');

    trigger(element).click();
    await fixture.whenStable();
    option('minute', '0').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.model().time).toBe('16:00');
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

function option(
  part: 'hour' | 'minute' | 'period',
  value: string,
): HTMLButtonElement {
  return document.querySelector(
    `[data-${part}="${value}"]`,
  ) as HTMLButtonElement;
}

function button(label: string): HTMLButtonElement {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent?.trim() === label,
  ) as HTMLButtonElement;
}
