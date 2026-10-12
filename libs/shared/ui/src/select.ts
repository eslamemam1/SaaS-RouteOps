import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  contentChildren,
  DOCUMENT,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { NgIcon } from '@ng-icons/core';
import { lucideCheck, lucideChevronDown } from '@ng-icons/lucide';

let nextId = 0;
const typeaheadPause = 700;

// One choice of an app-select; it renders nothing itself.
@Component({ selector: 'app-option', template: '' })
export class SelectOption {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
}

/**
 * A drop-down list in the style of the pickers, used in place of a native select.
 * It binds to a Signal Forms field through [formField], or to [value] and (valueChange).
 * The list opens in the top layer, so a scrolling drawer cannot cut it off.
 */
@Component({
  selector: 'app-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, NgIcon],
  template: `
    <button
      #origin="cdkOverlayOrigin"
      cdkOverlayOrigin
      type="button"
      class="app-select-trigger"
      role="combobox"
      aria-haspopup="listbox"
      [id]="triggerId"
      [attr.aria-label]="label() || null"
      [disabled]="disabled()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listId : null"
      [attr.aria-activedescendant]="
        open() && active() >= 0 ? optionId(active()) : null
      "
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      (keyup.space)="$event.preventDefault()"
      (blur)="onBlur()"
    >
      <span class="app-select-value">{{ chosen()?.label() }}</span>
      <ng-icon
        class="app-select-caret"
        [svg]="icons.caret"
        aria-hidden="true"
      />
    </button>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayMatchWidth
      cdkConnectedOverlayUsePopover="global"
      cdkConnectedOverlayPanelClass="app-select-pane"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="onOutsideClick($event)"
      (detach)="open.set(false)"
    >
      <div
        class="app-select-panel"
        role="listbox"
        [id]="listId"
        [attr.aria-labelledby]="triggerId"
        (mousedown)="$event.preventDefault()"
      >
        @for (option of options(); track $index) {
          <button
            type="button"
            tabindex="-1"
            class="app-select-option"
            role="option"
            [id]="optionId($index)"
            [attr.data-value]="option.value()"
            [class.app-select-option-active]="$index === active()"
            [attr.aria-selected]="option.value() === value()"
            (click)="choose($index)"
            (mousemove)="active.set($index)"
          >
            <span>{{ option.label() }}</span>
            @if (option.value() === value()) {
              <ng-icon
                class="app-select-check"
                [svg]="icons.check"
                aria-hidden="true"
              />
            }
          </button>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './select.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-select' },
})
export class Select<T extends string = string> implements FormValueControl<T> {
  readonly value = model<T>('' as T);
  readonly disabled = input(false);
  // Names the list when no label element holds it.
  readonly label = input('');
  readonly touch = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly id = nextId++;
  private typed = '';
  private typedAt = 0;

  protected readonly options = contentChildren(SelectOption, {
    descendants: true,
  });
  protected readonly triggerId = `app-select-${this.id}`;
  protected readonly listId = `app-select-${this.id}-list`;
  protected readonly icons = { caret: lucideChevronDown, check: lucideCheck };
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
  protected readonly active = signal(-1);
  protected readonly chosen = computed(() =>
    this.options().find((option) => option.value() === this.value()),
  );

  protected optionId(index: number): string {
    return `app-select-${this.id}-option-${index}`;
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  protected choose(index: number): void {
    const option = this.options()[index];
    this.close();
    if (option && option.value() !== this.value()) {
      this.value.set(option.value() as T);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = this.options().length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (this.open()) {
          const step = event.key === 'ArrowDown' ? 1 : -1;
          this.highlight(Math.min(last, Math.max(0, this.active() + step)));
        } else {
          this.show();
        }
        return;
      case 'Home':
      case 'End':
        if (this.open()) {
          event.preventDefault();
          this.highlight(event.key === 'Home' ? 0 : last);
        }
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.open()) {
          this.show();
        } else if (this.active() >= 0) {
          this.choose(this.active());
        } else {
          this.close();
        }
        return;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        return;
      case 'Tab':
        this.close();
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          this.typeahead(event.key);
        }
    }
  }

  protected onBlur(): void {
    if (!this.open()) {
      this.touch.emit();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
      this.touch.emit();
    }
  }

  private show(): void {
    if (this.disabled()) {
      return;
    }
    const selected = this.options().findIndex(
      (option) => option.value() === this.value(),
    );
    this.open.set(true);
    this.highlight(Math.max(0, selected));
  }

  private close(): void {
    this.open.set(false);
    this.active.set(-1);
  }

  private highlight(index: number): void {
    this.active.set(index);
    afterNextRender(
      () =>
        this.document
          .getElementById(this.optionId(index))
          ?.scrollIntoView?.({ block: 'nearest' }),
      { injector: this.injector },
    );
  }

  // Typing the first letters moves to the matching choice, as a native select does.
  private typeahead(key: string): void {
    const now = Date.now();
    this.typed = now - this.typedAt > typeaheadPause ? key : this.typed + key;
    this.typedAt = now;
    const wanted = this.typed.toLocaleLowerCase();
    const options = this.options();
    const current = this.open()
      ? this.active()
      : options.findIndex((option) => option.value() === this.value());
    const start = this.typed.length === 1 ? current + 1 : Math.max(0, current);
    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (
        options[index].label().trim().toLocaleLowerCase().startsWith(wanted)
      ) {
        if (this.open()) {
          this.highlight(index);
        } else {
          this.choose(index);
        }
        return;
      }
    }
  }
}
