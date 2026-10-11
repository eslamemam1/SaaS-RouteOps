import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideCalendarDays,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import {
  formatMonth,
  formatMonthName,
  injectText,
  LanguageService,
} from '@routeops/shared/i18n';
import { uiText } from './ui-text';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

// A month stored as YYYY-MM, moved by a number of months, such as 2026-01 by -1 to 2025-12.
export function addMonths(month: string, months: number): string {
  const [year, index] = month.split('-').map(Number);
  const total = year * 12 + index - 1 + months;
  const next = Math.floor(total / 12);
  return `${String(next).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}`;
}

// Chooses a month: a step back or forward, or any month of any year from a panel.
// current is the organization's month, offered as a shortcut when another month is shown.
@Component({
  selector: 'app-month-picker',
  imports: [NgIcon],
  template: `
    <div class="app-picker-control">
      <div class="app-picker-group" role="group" [attr.aria-label]="label()">
        <button
          type="button"
          class="app-picker-step"
          [attr.aria-label]="text().monthPicker.previous"
          [attr.title]="text().monthPicker.previous"
          (click)="step(-1)"
        >
          <ng-icon
            class="ro-icon-flip"
            [svg]="icons.previous"
            aria-hidden="true"
          />
        </button>
        <button
          #trigger
          type="button"
          class="app-picker-trigger"
          aria-haspopup="dialog"
          [attr.aria-expanded]="open()"
          (click)="toggle()"
        >
          <ng-icon
            class="app-picker-calendar"
            [svg]="icons.calendar"
            aria-hidden="true"
          />
          <span class="app-picker-value">{{ shown() }}</span>
          <ng-icon
            class="app-picker-caret"
            [svg]="icons.caret"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          class="app-picker-step"
          [attr.aria-label]="text().monthPicker.next"
          [attr.title]="text().monthPicker.next"
          (click)="step(1)"
        >
          <ng-icon class="ro-icon-flip" [svg]="icons.next" aria-hidden="true" />
        </button>
      </div>

      @if (open()) {
        <div
          #panel
          class="app-picker-panel"
          role="dialog"
          [attr.aria-label]="label()"
          (keydown.escape)="close(true)"
        >
          <div class="app-picker-panel-head">
            <button
              type="button"
              class="app-picker-step"
              [attr.aria-label]="text().monthPicker.previousYear"
              [attr.title]="text().monthPicker.previousYear"
              (click)="moveYear(-1)"
            >
              <ng-icon
                class="ro-icon-flip"
                [svg]="icons.previous"
                aria-hidden="true"
              />
            </button>
            <strong class="ro-numeric" aria-live="polite">{{ year() }}</strong>
            <button
              type="button"
              class="app-picker-step"
              [attr.aria-label]="text().monthPicker.nextYear"
              [attr.title]="text().monthPicker.nextYear"
              (click)="moveYear(1)"
            >
              <ng-icon
                class="ro-icon-flip"
                [svg]="icons.next"
                aria-hidden="true"
              />
            </button>
          </div>
          <div class="app-picker-months">
            @for (option of months(); track option.value) {
              <button
                type="button"
                class="app-picker-option"
                [class.app-picker-option-today]="option.value === current()"
                [attr.aria-pressed]="option.value === month()"
                [attr.aria-label]="option.label"
                (click)="choose(option.value)"
              >
                {{ option.name }}
              </button>
            }
          </div>
          @if (current() && year() !== yearOf(current())) {
            <button
              type="button"
              class="app-picker-shortcut"
              (click)="choose(current())"
            >
              {{ text().monthPicker.thisMonth }}
            </button>
          }
        </div>
      }
    </div>

    @if (current() && month() !== current()) {
      <button
        type="button"
        class="app-picker-today"
        (click)="choose(current())"
      >
        {{ text().monthPicker.thisMonth }}
      </button>
    }
  `,
  styleUrl: './picker.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-picker',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class MonthPicker {
  readonly month = input.required<string>();
  readonly label = input.required<string>();
  readonly current = input('');
  readonly monthChange = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly language = inject(LanguageService).language;
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly text = injectText(uiText);
  protected readonly icons = {
    previous: lucideChevronLeft,
    next: lucideChevronRight,
    calendar: lucideCalendarDays,
    caret: lucideChevronDown,
  };
  protected readonly open = signal(false);
  protected readonly year = signal(0);
  protected readonly shown = computed(() =>
    formatMonth(this.month(), this.language()),
  );
  protected readonly months = computed(() => {
    const language = this.language();
    return Array.from({ length: 12 }, (_, index) => {
      const value = `${String(this.year()).padStart(4, '0')}-${String(index + 1).padStart(2, '0')}`;
      return {
        value,
        name: formatMonthName(value, language),
        label: formatMonth(value, language),
      };
    });
  });

  protected yearOf(month: string): number {
    return Number(month.slice(0, 4));
  }

  protected step(months: number): void {
    if (monthPattern.test(this.month())) {
      this.monthChange.emit(addMonths(this.month(), months));
    }
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const shown = monthPattern.test(this.month())
      ? this.month()
      : this.current();
    this.year.set(this.yearOf(shown) || new Date().getFullYear());
    this.open.set(true);
    afterNextRender(() => this.focusMonth(), { injector: this.injector });
  }

  private focusMonth(): void {
    const panel = this.panel()?.nativeElement;
    const target = [
      '[aria-pressed="true"]',
      '.app-picker-option-today',
      '.app-picker-option',
    ]
      .map((selector) => panel?.querySelector<HTMLButtonElement>(selector))
      .find(Boolean);
    target?.focus();
  }

  protected moveYear(years: number): void {
    this.year.update((year) => year + years);
  }

  protected choose(month: string): void {
    this.close(true);
    if (month !== this.month()) {
      this.monthChange.emit(month);
    }
  }

  protected close(focusTrigger = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (focusTrigger) {
      afterNextRender(() => this.trigger()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (
      this.open() &&
      !this.host.nativeElement.contains(event.target as Node)
    ) {
      this.open.set(false);
    }
  }
}
