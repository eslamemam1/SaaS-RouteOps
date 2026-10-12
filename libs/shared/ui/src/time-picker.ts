import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { NgIcon } from '@ng-icons/core';
import { lucideChevronDown, lucideClock } from '@ng-icons/lucide';
import { formatTime, injectText, LanguageService } from '@routeops/shared/i18n';
import { Button } from './button';
import { uiText } from './ui-text';

type Period = 'am' | 'pm';

interface TimeParts {
  readonly hour: number | null;
  readonly minute: number | null;
  readonly period: Period;
}

let nextId = 0;
const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteStep = 5;
const periods: readonly Period[] = ['am', 'pm'];
const emptyParts: TimeParts = { hour: null, minute: null, period: 'am' };

// Splits a time stored as HH:MM or HH:MM:SS into the 12-hour parts the panel shows.
export function timeParts(value: string): TimeParts {
  const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(value);
  if (!match) {
    return emptyParts;
  }
  const hours24 = Number(match[1]);
  return {
    hour: hours24 % 12 === 0 ? 12 : hours24 % 12,
    minute: Number(match[2]),
    period: hours24 < 12 ? 'am' : 'pm',
  };
}

// Joins 12-hour parts into HH:MM; there is no time until an hour is chosen.
export function joinTime(parts: TimeParts): string {
  if (parts.hour === null) {
    return '';
  }
  const hours24 = (parts.hour % 12) + (parts.period === 'pm' ? 12 : 0);
  return `${pad(hours24)}:${pad(parts.minute ?? 0)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * A time chosen from hour, minute, and AM or PM columns, shown on a 12-hour clock.
 * It binds to a Signal Forms field through [formField], or to [value] and (valueChange),
 * and stores HH:MM as a native time input does, or an empty string for no time.
 */
@Component({
  selector: 'app-time-picker',
  imports: [Button, CdkConnectedOverlay, CdkOverlayOrigin, NgIcon],
  template: `
    <button
      #trigger
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="app-select-trigger"
      aria-haspopup="dialog"
      [attr.aria-label]="label() || null"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null"
      [disabled]="disabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      (blur)="onBlur()"
    >
      <ng-icon class="app-time-icon" [svg]="icons.clock" aria-hidden="true" />
      <span class="app-select-value" [class.app-time-empty]="!shown()">
        {{ shown() || text().timePicker.placeholder }}
      </span>
      <ng-icon
        class="app-select-caret"
        [svg]="icons.caret"
        aria-hidden="true"
      />
    </button>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayUsePopover="global"
      cdkConnectedOverlayPanelClass="app-select-pane"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="onOutsideClick($event)"
      (detach)="open.set(false)"
    >
      <div
        #panel
        class="app-time-panel"
        role="dialog"
        [id]="panelId"
        [attr.aria-label]="label() || text().timePicker.label"
        (keydown)="onPanelKeydown($event)"
        (focusout)="onPanelFocusout($event)"
      >
        <div class="app-time-columns">
          <div
            class="app-time-column"
            role="listbox"
            [attr.aria-label]="text().timePicker.hour"
          >
            @for (hour of hours; track hour) {
              <button
                type="button"
                class="app-time-option"
                role="option"
                [attr.data-hour]="hour"
                [attr.aria-selected]="draft().hour === hour"
                [tabindex]="(draft().hour ?? hours[0]) === hour ? 0 : -1"
                (click)="choose({ hour })"
              >
                {{ hour }}
              </button>
            }
          </div>
          <div
            class="app-time-column"
            role="listbox"
            [attr.aria-label]="text().timePicker.minute"
          >
            @for (minute of minutes(); track minute) {
              <button
                type="button"
                class="app-time-option"
                role="option"
                [attr.data-minute]="minute"
                [attr.aria-selected]="draft().minute === minute"
                [tabindex]="(draft().minute ?? 0) === minute ? 0 : -1"
                (click)="choose({ minute })"
              >
                {{ pad(minute) }}
              </button>
            }
          </div>
          <div
            class="app-time-column"
            role="listbox"
            [attr.aria-label]="text().timePicker.period"
          >
            @for (period of periods; track period) {
              <button
                type="button"
                class="app-time-option"
                role="option"
                [attr.data-period]="period"
                [attr.aria-selected]="draft().period === period"
                [tabindex]="draft().period === period ? 0 : -1"
                (click)="choose({ period })"
              >
                {{ text().timePicker[period] }}
              </button>
            }
          </div>
        </div>
        <div class="app-time-foot">
          @if (value()) {
            <button appButton="text" size="sm" type="button" (click)="clear()">
              {{ text().timePicker.clear }}
            </button>
          }
          <button appButton size="sm" type="button" (click)="close(true)">
            {{ text().timePicker.done }}
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./select.css', './time-picker.css'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-select app-time-picker' },
})
export class TimePicker implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  // Names the picker when no label element holds it.
  readonly label = input('');
  readonly touch = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly language = inject(LanguageService).language;
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly text = injectText(uiText);
  protected readonly panelId = `app-time-${nextId++}`;
  protected readonly icons = { caret: lucideChevronDown, clock: lucideClock };
  protected readonly hours = hours;
  protected readonly periods = periods;
  protected readonly pad = pad;
  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];
  protected readonly open = signal(false);
  // The parts chosen so far; the minute or period may come before the hour.
  protected readonly draft = signal<TimeParts>(emptyParts);
  protected readonly shown = computed(() =>
    this.value() ? formatTime(this.value(), this.language()) : '',
  );
  protected readonly minutes = computed(() => {
    const minutes = Array.from(
      { length: 60 / minuteStep },
      (_, index) => index * minuteStep,
    );
    const minute = this.draft().minute;
    return minute === null || minutes.includes(minute)
      ? minutes
      : [...minutes, minute].sort((a, b) => a - b);
  });

  protected toggle(): void {
    if (this.open()) {
      this.close(true);
    } else {
      this.show();
    }
  }

  protected choose(change: Partial<TimeParts>): void {
    const parts = { ...this.draft(), ...change };
    this.draft.set(parts);
    const time = joinTime(parts);
    if (time && time !== this.value()) {
      this.value.set(time);
    }
  }

  protected clear(): void {
    this.draft.set(emptyParts);
    this.value.set('');
    this.close(true);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (
      !this.open() &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault();
      this.show();
    }
  }

  // Up and down move within a column, Home and End to its ends, and Escape closes.
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    const current = event.target as HTMLElement;
    const column = current.closest('.app-time-column');
    if (!column) {
      return;
    }
    const options = [
      ...column.querySelectorAll<HTMLButtonElement>('.app-time-option'),
    ];
    const index = options.indexOf(current as HTMLButtonElement);
    const last = options.length - 1;
    const next =
      event.key === 'ArrowDown'
        ? Math.min(last, index + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next >= 0) {
      event.preventDefault();
      options[next].focus();
    }
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (
      next &&
      !this.panel()?.nativeElement.contains(next) &&
      !this.host.nativeElement.contains(next)
    ) {
      this.close(false);
    }
  }

  protected onBlur(): void {
    if (!this.open()) {
      this.touch.emit();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  private show(): void {
    if (this.disabled()) {
      return;
    }
    this.draft.set(timeParts(this.value()));
    this.open.set(true);
    afterNextRender(
      () => {
        const panel = this.panel()?.nativeElement;
        for (const option of panel?.querySelectorAll<HTMLElement>(
          '.app-time-option[tabindex="0"]',
        ) ?? []) {
          option.scrollIntoView?.({ block: 'center' });
        }
        panel
          ?.querySelector<HTMLElement>('.app-time-option[tabindex="0"]')
          ?.focus();
      },
      { injector: this.injector },
    );
  }

  // Closing returns focus to the trigger when the member closed it from the panel.
  protected close(refocus: boolean): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.touch.emit();
    if (refocus) {
      this.trigger().nativeElement.focus();
    }
  }
}
