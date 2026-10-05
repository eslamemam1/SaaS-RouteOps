import {
  Component,
  computed,
  input,
  Signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectText } from '@routeops/shared/i18n';
import { uiText } from './ui-text';

/** Matches a Signal Forms field, so any form field can be passed as `control`. */
export type FieldControl = () => {
  readonly touched: Signal<boolean>;
  readonly errors: Signal<readonly { readonly message?: string }[]>;
};

@Component({
  selector: 'app-field',
  templateUrl: './field.html',
  styleUrl: './field.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-field', '[class.app-field-invalid]': 'error()' },
})
export class Field {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly optional = input(false);
  readonly control = input<FieldControl>();

  protected readonly text = injectText(uiText);
  protected readonly error = computed(() => {
    const control = this.control();
    if (!control) {
      return '';
    }
    const state = control();
    return state.touched() ? (state.errors()[0]?.message ?? '') : '';
  });
}
