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
  formatDay,
  formatMonth,
  formatWeekdayShort,
  injectText,
  LanguageService,
} from '@routeops/shared/i18n';
import { addMonths } from './month-picker';
import { uiText } from './ui-text';

const dayPattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// A Saturday, the day a week starts on in Egypt, which the calendar columns follow.
const firstSaturday = '2026-01-03';

// A day stored as YYYY-MM-DD, moved by a number of days, such as 2026-03-01 by -1 to 2026-02-28.
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + days))
    .toISOString()
    .slice(0, 10);
}

interface DayCell {
  readonly value: string;
  readonly number: number;
  readonly label: string;
}

// Chooses a day from a month calendar. today is the organization's day, marked on
// the calendar and offered as a shortcut while another month is shown.
@Component({
  selector: 'app-day-picker',
  imports: [NgIcon],
  template: `
    <div class="app-picker-control">
      <div class="app-picker-group">
        <button
          #trigger
          type="button"
          class="app-picker-trigger"
          aria-haspopup="dialog"
          [attr.aria-label]="label() + ': ' + shown()"
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
              [attr.aria-label]="text().dayPicker.previousMonth"
              [attr.title]="text().dayPicker.previousMonth"
              (click)="moveView(-1)"
            >
              <ng-icon
                class="ro-icon-flip"
                [svg]="icons.previous"
                aria-hidden="true"
              />
            </button>
            <strong aria-live="polite">{{ viewLabel() }}</strong>
            <button
              type="button"
              class="app-picker-step"
              [attr.aria-label]="text().dayPicker.nextMonth"
              [attr.title]="text().dayPicker.nextMonth"
              (click)="moveView(1)"
            >
              <ng-icon
                class="ro-icon-flip"
                [svg]="icons.next"
                aria-hidden="true"
              />
            </button>
          </div>
          <div class="app-picker-days">
            @for (name of weekdays(); track $index) {
              <span class="app-picker-weekday" aria-hidden="true">{{
                name
              }}</span>
            }
            @for (cell of cells(); track $index) {
              @if (cell) {
                <button
                  type="button"
                  class="app-picker-option ro-numeric"
                  [class.app-picker-option-today]="cell.value === today()"
                  [attr.aria-pressed]="cell.value === day()"
                  [attr.aria-label]="cell.label"
                  [attr.data-day]="cell.value"
                  [tabIndex]="cell.value === tabStop() ? 0 : -1"
                  (click)="choose(cell.value)"
                  (keydown)="onDaysKey($event)"
                >
                  {{ cell.number }}
                </button>
              } @else {
                <span aria-hidden="true"></span>
              }
            }
          </div>
          @if (today() && today().slice(0, 7) !== view()) {
            <button
              type="button"
              class="app-picker-shortcut"
              (click)="choose(today())"
            >
              {{ text().dayPicker.today }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './picker.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-picker',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DayPicker {
  readonly day = input.required<string>();
  readonly label = input.required<string>();
  readonly today = input('');
  readonly dayChange = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly languageService = inject(LanguageService);
  private readonly language = this.languageService.language;
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
  // The month the calendar shows, YYYY-MM, and the day the keyboard is on.
  protected readonly view = signal('');
  private readonly active = signal('');
  protected readonly shown = computed(() =>
    formatDay(this.day(), this.language()),
  );
  protected readonly viewLabel = computed(() =>
    formatMonth(this.view(), this.language()),
  );
  protected readonly weekdays = computed(() => {
    const language = this.language();
    return Array.from({ length: 7 }, (_, index) =>
      formatWeekdayShort(addDays(firstSaturday, index), language),
    );
  });
  protected readonly cells = computed((): (DayCell | null)[] => {
    const view = this.view();
    if (!view) {
      return [];
    }
    const language = this.language();
    const first = `${view}-01`;
    const [year, month] = view.split('-').map(Number);
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const before = (new Date(`${first}T00:00:00Z`).getUTCDay() + 1) % 7;
    return [
      ...Array.from({ length: before }, () => null),
      ...Array.from({ length }, (_, index) => {
        const value = addDays(first, index);
        return { value, number: index + 1, label: formatDay(value, language) };
      }),
    ];
  });
  // The one day of the calendar Tab reaches; arrow keys move it.
  protected readonly tabStop = computed(() =>
    this.active().slice(0, 7) === this.view()
      ? this.active()
      : `${this.view()}-01`,
  );

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const start = dayPattern.test(this.day()) ? this.day() : this.today();
    if (!dayPattern.test(start)) {
      return;
    }
    this.active.set(start);
    this.view.set(start.slice(0, 7));
    this.open.set(true);
    this.focusActive();
  }

  protected moveView(months: number): void {
    this.view.update((view) => addMonths(view, months));
  }

  protected onDaysKey(event: KeyboardEvent): void {
    const forward = this.languageService.direction() === 'rtl' ? -1 : 1;
    const moves: Record<string, number> = {
      ArrowRight: forward,
      ArrowLeft: -forward,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    const days = moves[event.key];
    if (days === undefined) {
      return;
    }
    event.preventDefault();
    const next = addDays(this.tabStop(), days);
    this.active.set(next);
    this.view.set(next.slice(0, 7));
    this.focusActive();
  }

  protected choose(day: string): void {
    this.close(true);
    if (day !== this.day()) {
      this.dayChange.emit(day);
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

  private focusActive(): void {
    afterNextRender(
      () =>
        this.panel()
          ?.nativeElement.querySelector<HTMLButtonElement>(
            `[data-day="${this.active()}"]`,
          )
          ?.focus(),
      { injector: this.injector },
    );
  }
}
