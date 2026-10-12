import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@routeops/shared/i18n';
import { pageSlots, paginate, Pager } from './pager';

const numbers = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1);

describe('paginate', () => {
  it('shows one page of the list and where it starts and ends', () => {
    const pages = paginate(() => numbers(60));

    expect(pages.items()).toEqual(numbers(25));
    expect(pages.pageCount()).toBe(3);

    pages.go(3);

    expect(pages.items()).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
    expect([pages.from(), pages.to(), pages.total()]).toEqual([51, 60, 60]);
  });

  it('stays within the pages there are when the list gets shorter', () => {
    const list = signal(numbers(60));
    const pages = paginate(list);
    pages.go(3);

    list.set(numbers(30));

    expect(pages.page()).toBe(2);
    expect(pages.items()).toEqual([26, 27, 28, 29, 30]);
  });

  it('goes back to the first page when a filter or the page size changes', () => {
    const filter = signal('');
    const pages = paginate(() => numbers(120), { resetOn: filter });
    pages.go(4);

    filter.set('north');
    expect(pages.page()).toBe(1);

    pages.go(2);
    pages.size.set(50);
    expect(pages.page()).toBe(1);
    expect(pages.pageCount()).toBe(3);
  });

  it('counts nothing for an empty list', () => {
    const pages = paginate(() => []);

    expect([pages.page(), pages.pageCount(), pages.from(), pages.to()]).toEqual(
      [1, 1, 0, 0],
    );
  });
});

describe('pageSlots', () => {
  it('lists every page when there are few', () => {
    expect(pageSlots(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the first, the last, and the pages around the current one', () => {
    expect(pageSlots(1, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
    expect(pageSlots(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
    expect(pageSlots(20, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
  });
});

@Component({
  imports: [Pager],
  template: `
    <ul>
      @for (item of pages.items(); track $index) {
        <li>{{ item }}</li>
      }
    </ul>
    <app-pager [pages]="pages" />
  `,
})
class List {
  readonly list = signal(numbers(30));
  readonly pages = paginate(this.list, { size: 10 });
}

describe('Pager', () => {
  beforeEach(() => TestBed.inject(LanguageService).setLanguage('ar'));

  it('moves between pages and marks the current one', async () => {
    const fixture = TestBed.createComponent(List);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-pager')?.hasAttribute('hidden')).toBe(
      false,
    );
    expect(element.querySelector('.app-pager-range')?.textContent).toContain(
      '1–10',
    );

    button(element, 'الصفحة التالية').click();
    await fixture.whenStable();

    expect(element.querySelector('li')?.textContent).toBe('11');
    expect(
      element.querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe('2');
    expect(element.querySelector('.app-pager-range')?.textContent).toContain(
      '11–20',
    );

    button(element, 'صفحة 3').click();
    await fixture.whenStable();

    expect(element.querySelector('li')?.textContent).toBe('21');
    expect(button(element, 'الصفحة التالية').disabled).toBe(true);
  });

  it('changes how many rows a page shows', async () => {
    const fixture = TestBed.createComponent(List);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('.app-select-trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    (
      document.querySelector('[role="option"][data-value="50"]') as HTMLElement
    ).click();
    await fixture.whenStable();

    expect(element.querySelectorAll('li')).toHaveLength(30);
    expect(element.querySelector('.app-pager-pages')).toBeNull();
    expect(element.querySelector('.app-pager')?.hasAttribute('hidden')).toBe(
      false,
    );
  });

  it('stays out of sight when the list fits on one page', async () => {
    const fixture = TestBed.createComponent(List);
    fixture.componentInstance.list.set(numbers(8));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-pager')?.hasAttribute('hidden')).toBe(
      true,
    );
    expect(element.querySelectorAll('li')).toHaveLength(8);
  });
});

function button(element: HTMLElement, label: string): HTMLButtonElement {
  const found = [...element.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.getAttribute('aria-label') === label,
  );
  if (!found) {
    throw new Error(`No button labelled ${label}`);
  }
  return found;
}
