import { Component, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="app-page-header-titles">
      <h1>{{ title() }}</h1>
      @if (hint()) {
        <p class="app-page-header-hint">{{ hint() }}</p>
      }
    </div>
    <div class="app-page-header-actions"><ng-content /></div>
  `,
  styleUrl: './page-header.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-page-header' },
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly hint = input('');
}
