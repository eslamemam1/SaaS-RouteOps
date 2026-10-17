import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { addDays, DayPicker } from './day-picker';

@Component({
  imports: [DayPicker],
  template: `
    <app-day-picker
      label="اليوم"
      today="2026-10-12"
      [day]="day()"
      [max]="max()"
      (dayChange)="day.set($event)"
    />
    <p>outside</p>
  `,
})
class Host {
  readonly day = signal('2026-10-12');
  readonly max = signal('');
}

describe('addDays', () => {
  it('moves across the ends of a month and a year', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('DayPicker', () => {
  beforeEach(() => TestBed.inject(LanguageService).setLanguage('ar'));

  it('shows the day and lays out its month from Saturday', async () => {
    const { fixture, element } = await render();

    expect(trigger(element).textContent?.trim()).toBe('12 أكتوبر 2026');

    trigger(element).click();
    await fixture.whenStable();

    const weekdays = [...element.querySelectorAll('.app-picker-weekday')];
    expect(weekdays.map((item) => item.textContent?.trim())).toEqual([
      'س',
      'ح',
      'ن',
      'ث',
      'ر',
      'خ',
      'ج',
    ]);
    const cells = [
      ...element.querySelectorAll(
        '.app-picker-days > :not(.app-picker-weekday)',
      ),
    ];
    expect(cells[5].textContent?.trim()).toBe('1');
    expect(
      element
        .querySelector('[aria-pressed="true"]')
        ?.getAttribute('aria-label'),
    ).toBe('12 أكتوبر 2026');
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-10-12');
  });

  it('chooses a day of another month', async () => {
    const { fixture, element } = await render();

    trigger(element).click();
    await fixture.whenStable();
    labelled(element, 'الشهر السابق')?.click();
    await fixture.whenStable();

    expect(labelled(element, 'اليوم')).toBeDefined();
    labelled(element, '30 سبتمبر 2026')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.day()).toBe('2026-09-30');
    expect(element.querySelector('.app-picker-panel')).toBeNull();
  });

  it('moves between days with the arrow keys, right to left in Arabic', async () => {
    const { fixture, element } = await render();

    trigger(element).click();
    await fixture.whenStable();
    press('ArrowLeft');
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-10-13');

    press('ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-10-20');

    (document.activeElement as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.day()).toBe('2026-10-20');
  });

  it('disables days and later months after the maximum day', async () => {
    const { fixture, element } = await render();
    fixture.componentInstance.max.set('2026-10-12');
    await fixture.whenStable();

    trigger(element).click();
    await fixture.whenStable();

    expect(labelled(element, 'الشهر التالي')?.disabled).toBe(true);
    expect(labelled(element, '13 أكتوبر 2026')?.disabled).toBe(true);
    labelled(element, '13 أكتوبر 2026')?.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.day()).toBe('2026-10-12');
  });

  it('closes on a click outside it without changing the day', async () => {
    const { fixture, element } = await render();

    trigger(element).click();
    await fixture.whenStable();
    element.querySelector('p')?.click();
    await fixture.whenStable();

    expect(element.querySelector('.app-picker-panel')).toBeNull();
    expect(fixture.componentInstance.day()).toBe('2026-10-12');
  });
});

async function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.autoDetectChanges();
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

function trigger(element: HTMLElement): HTMLButtonElement {
  return element.querySelector('.app-picker-trigger') as HTMLButtonElement;
}

function press(key: string): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true }),
  );
}

function labelled(
  element: HTMLElement,
  label: string,
): HTMLButtonElement | undefined {
  return [...element.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) =>
      item.getAttribute('aria-label') === label ||
      item.textContent?.trim() === label,
  );
}
