import { Component, input, ViewEncapsulation } from '@angular/core';

export type PageStateKind = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-page-state',
  template: `
    @if (kind() === 'loading') {
      <span class="app-page-state-spinner" aria-hidden="true"></span>
    }
    @if (title()) {
      <h2 class="app-page-state-title">{{ title() }}</h2>
    }
    <p class="app-page-state-message">{{ message() }}</p>
    <ng-content />
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
}
