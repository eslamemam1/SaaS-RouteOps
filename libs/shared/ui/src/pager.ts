import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  Signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Select, SelectOption } from './select';
import { uiText } from './ui-text';

export const pageSizes = [10, 25, 50, 100] as const;

export type PageSize = (typeof pageSizes)[number];

// One page of a list. page is counted from 1 and stays within the pages there are.
export interface Pages<T> {
  readonly items: Signal<readonly T[]>;
  readonly page: Signal<number>;
  readonly pageCount: Signal<number>;
  readonly size: WritableSignal<PageSize>;
  readonly total: Signal<number>;
  readonly from: Signal<number>;
  readonly to: Signal<number>;
  readonly initialSize: PageSize;
  go(page: number): void;
}

export interface PageOptions {
  readonly size?: PageSize;
  // Going back to the first page when any value it reads changes, such as a filter.
  readonly resetOn?: () => unknown;
}

// Splits a list into pages. A new page size, or a change resetOn reads, goes back to the first page.
export function paginate<T>(
  source: () => readonly T[],
  options: PageOptions = {},
): Pages<T> {
  const initialSize = options.size ?? 25;
  const size = signal<PageSize>(initialSize);
  const resetOn = options.resetOn ?? (() => null);
  const chosen = linkedSignal({
    source: () => [size(), resetOn()],
    computation: () => 1,
  });
  const total = computed(() => source().length);
  const pageCount = computed(() => Math.max(1, Math.ceil(total() / size())));
  const page = computed(() => Math.min(Math.max(chosen(), 1), pageCount()));
  const from = computed(() => (total() === 0 ? 0 : (page() - 1) * size() + 1));
  const to = computed(() => Math.min(page() * size(), total()));
  const items = computed(() =>
    source().slice((page() - 1) * size(), page() * size()),
  );
  return {
    items,
    page,
    pageCount,
    size,
    total,
    from,
    to,
    initialSize,
    go: (next) => chosen.set(next),
  };
}

type Slot = number | 'gap';

// The page buttons: every page when there are few, or the first, the last, and the ones
// around the current page, with a gap for the pages left out.
export function pageSlots(page: number, pageCount: number): Slot[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const middle = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );
  return [
    1,
    ...(start > 2 ? (['gap'] as const) : []),
    ...middle,
    ...(end < pageCount - 1 ? (['gap'] as const) : []),
    pageCount,
  ];
}

@Component({
  selector: 'app-pager',
  imports: [NgIcon, Select, SelectOption],
  template: `
    @let list = pages();
    <p class="app-pager-range" aria-live="polite">
      {{ text().pager.showing }}
      <bdi class="ro-numeric" dir="ltr">{{ list.from() }}–{{ list.to() }}</bdi>
      {{ text().pager.of }}
      <bdi class="ro-numeric">{{ list.total() }}</bdi>
    </p>

    @if (list.pageCount() > 1) {
      <nav class="app-pager-pages" [attr.aria-label]="text().pager.label">
        <button
          type="button"
          class="app-pager-step"
          [disabled]="list.page() === 1"
          [attr.aria-label]="text().pager.previous"
          [attr.title]="text().pager.previous"
          (click)="go(list.page() - 1)"
        >
          <ng-icon
            class="ro-icon-flip"
            [svg]="icons.previous"
            aria-hidden="true"
          />
        </button>
        @for (slot of slots(); track $index) {
          @if (slot === 'gap') {
            <span class="app-pager-gap" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="app-pager-page ro-numeric"
              [attr.aria-current]="slot === list.page() ? 'page' : null"
              [attr.aria-label]="text().pager.page + ' ' + slot"
              (click)="go(slot)"
            >
              {{ slot }}
            </button>
          }
        }
        <button
          type="button"
          class="app-pager-step"
          [disabled]="list.page() === list.pageCount()"
          [attr.aria-label]="text().pager.next"
          [attr.title]="text().pager.next"
          (click)="go(list.page() + 1)"
        >
          <ng-icon class="ro-icon-flip" [svg]="icons.next" aria-hidden="true" />
        </button>
      </nav>
    }

    <div class="app-pager-size">
      <span aria-hidden="true">{{ text().pager.perPage }}</span>
      <app-select
        [label]="text().pager.perPage"
        [value]="'' + list.size()"
        (valueChange)="resize($event)"
      >
        @for (size of sizes; track size) {
          <app-option [value]="'' + size" [label]="'' + size" />
        }
      </app-select>
    </div>
  `,
  styleUrl: './pager.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-pager',
    '[hidden]': '!shown()',
  },
})
export class Pager {
  readonly pages = input.required<Pages<unknown>>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly text = injectText(uiText);
  protected readonly sizes = pageSizes;
  protected readonly icons = {
    previous: lucideChevronLeft,
    next: lucideChevronRight,
  };
  protected readonly slots = computed(() =>
    pageSlots(this.pages().page(), this.pages().pageCount()),
  );
  // A short list needs no pages, unless the member chose a page size that made it so.
  protected readonly shown = computed(() => {
    const list = this.pages();
    return list.pageCount() > 1 || list.size() !== list.initialSize;
  });

  protected go(page: number): void {
    this.pages().go(page);
    this.showListTop();
  }

  protected resize(value: string): void {
    const size = pageSizes.find((option) => option === Number(value));
    if (size) {
      this.pages().size.set(size);
      this.showListTop();
    }
  }

  // After the page changes, the list starts again at its top when that is out of sight,
  // above the window or under the sticky top bar its scroll margin leaves room for.
  private showListTop(): void {
    const list =
      this.host.nativeElement.closest('.ro-card') ?? this.host.nativeElement;
    if (typeof list.scrollIntoView !== 'function') {
      return;
    }
    const margin =
      parseFloat(getComputedStyle(list).scrollMarginBlockStart) || 0;
    if (list.getBoundingClientRect().top < margin) {
      list.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
}
