import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { addMonths, MonthPicker } from './month-picker';

@Component({
  imports: [MonthPicker],
  template: `
    <app-month-picker
      label="الشهر"
      current="2026-10"
      [month]="month()"
      (monthChange)="month.set($event)"
    />
    <p>outside</p>
  `,
})
class Host {
  readonly month = signal('2026-10');
}

describe('addMonths', () => {
  it('moves across the ends of a year', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-10', -22)).toBe('2024-12');
  });
});

describe('MonthPicker', () => {
  beforeEach(() => TestBed.inject(LanguageService).setLanguage('ar'));

  it('shows the month by name and steps to the month before and after it', async () => {
    const { fixture, element } = await render();

    expect(trigger(element).textContent?.trim()).toBe('أكتوبر 2026');
    expect(labelled(element, 'الشهر الحالي')).toBeUndefined();

    labelled(element, 'الشهر السابق')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.month()).toBe('2026-09');
    expect(trigger(element).textContent?.trim()).toBe('سبتمبر 2026');

    labelled(element, 'الشهر الحالي')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.month()).toBe('2026-10');
  });

  it('chooses a month of another year from the panel', async () => {
    const { fixture, element } = await render();

    trigger(element).click();
    await fixture.whenStable();

    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    expect(
      element.querySelector('[aria-pressed="true"]')?.textContent?.trim(),
    ).toBe('أكتوبر');

    labelled(element, 'السنة السابقة')?.click();
    await fixture.whenStable();
    labelled(element, 'مارس 2025')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.month()).toBe('2025-03');
    expect(element.querySelector('.app-picker-panel')).toBeNull();
  });

  it('closes the panel on Escape or a click outside it', async () => {
    const { fixture, element } = await render();

    trigger(element).click();
    await fixture.whenStable();
    element
      .querySelector('.app-picker-panel')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(element.querySelector('.app-picker-panel')).toBeNull();

    trigger(element).click();
    await fixture.whenStable();
    element.querySelector('p')?.click();
    await fixture.whenStable();
    expect(element.querySelector('.app-picker-panel')).toBeNull();
    expect(fixture.componentInstance.month()).toBe('2026-10');
  });
});

async function render() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

function trigger(element: HTMLElement): HTMLButtonElement {
  return element.querySelector('.app-picker-trigger') as HTMLButtonElement;
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
