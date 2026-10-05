import {
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgIcon } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { uiText } from './ui-text';

const scrollLock = 'app-scroll-locked';
let nextId = 0;

@Component({
  selector: 'app-form-drawer',
  imports: [CdkTrapFocus, NgIcon],
  template: `
    @if (open()) {
      <button
        type="button"
        class="backdrop"
        tabindex="-1"
        [attr.aria-label]="text().close"
        (click)="close()"
      ></button>
      <div
        class="panel"
        role="dialog"
        aria-modal="true"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [attr.aria-labelledby]="titleId"
        (keydown.escape)="close()"
      >
        <header class="header">
          <h2 class="title" [id]="titleId">{{ title() }}</h2>
          <button
            type="button"
            class="close"
            [attr.aria-label]="text().close"
            (click)="close()"
          >
            <ng-icon [svg]="closeIcon" aria-hidden="true" />
          </button>
        </header>
        <div class="content"><ng-content /></div>
      </div>
    }
  `,
  styleUrl: './form-drawer.css',
})
export class FormDrawer {
  readonly open = model(false);
  readonly title = input.required<string>();

  protected readonly text = injectText(uiText);
  protected readonly closeIcon = lucideX;
  protected readonly titleId = `app-form-drawer-title-${nextId++}`;

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => root.classList.toggle(scrollLock, this.open()));
    inject(DestroyRef).onDestroy(() => root.classList.remove(scrollLock));
  }

  protected close(): void {
    this.open.set(false);
  }
}
