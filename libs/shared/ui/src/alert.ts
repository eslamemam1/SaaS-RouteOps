import { Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Tone } from './tag';
import { uiText } from './ui-text';

@Component({
  selector: 'app-alert',
  imports: [NgIcon],
  template: `
    <div class="body">
      @if (title()) {
        <strong class="title">{{ title() }}</strong>
      }
      <div class="message"><ng-content /></div>
    </div>
    @if (dismissible()) {
      <button
        type="button"
        class="close"
        [attr.aria-label]="text().close"
        (click)="dismissed.emit()"
      >
        <ng-icon [svg]="closeIcon" aria-hidden="true" />
      </button>
    }
  `,
  styleUrl: './alert.css',
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
  },
})
export class Alert {
  readonly tone = input<Tone>('info');
  readonly title = input('');
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  protected readonly text = injectText(uiText);
  protected readonly closeIcon = lucideX;
}
