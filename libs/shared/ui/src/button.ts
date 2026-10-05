import { Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type ButtonSize = 'md' | 'sm';

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'app-button',
    '[attr.data-variant]': "appButton() || 'primary'",
    '[attr.data-size]': 'size()',
  },
})
export class Button {
  readonly appButton = input<ButtonVariant | ''>('');
  readonly size = input<ButtonSize>('md');
}
