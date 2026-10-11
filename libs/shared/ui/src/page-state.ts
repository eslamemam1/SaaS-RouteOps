import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { injectText } from '@routeops/shared/i18n';
import { Button } from './button';
import { uiText } from './ui-text';

export type PageStateKind = 'loading' | 'empty' | 'error';

// An error that may pass, such as a lost connection, offers to try again when
// the page listens to retry.
@Component({
  selector: 'app-page-state',
  imports: [Button],
  template: `
    @if (kind() === 'loading') {
      <span class="app-page-state-spinner" aria-hidden="true"></span>
    }
    @if (title()) {
      <h2 class="app-page-state-title">{{ title() }}</h2>
    }
    <p class="app-page-state-message">{{ message() }}</p>
    <ng-content />
    @if (kind() === 'error' && retryable()) {
      <button appButton="secondary" type="button" (click)="retry.emit()">
        {{ text().retry }}
      </button>
    }
  `,
  styleUrl: './page-state.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-page-state ro-card',
    '[class.app-page-state-error]': "kind() === 'error'",
    '[attr.role]': "kind() === 'error' ? 'alert' : 'status'",
  },
})
export class PageState {
  readonly kind = input.required<PageStateKind>();
  readonly message = input.required<string>();
  readonly title = input('');
  readonly retryable = input(false);
  readonly retry = output<void>();

  protected readonly text = injectText(uiText);
}
