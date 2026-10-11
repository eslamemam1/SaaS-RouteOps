import {
  Component,
  DOCUMENT,
  effect,
  inject,
  model,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideLayoutGrid, lucideTable } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { uiText } from './ui-text';

export type ListView = 'table' | 'cards';

const listViews: readonly ListView[] = ['table', 'cards'];

// The view a list was last shown in, remembered in the browser for each list.
export function injectListView(list: string): WritableSignal<ListView> {
  const storage = inject(DOCUMENT).defaultView?.localStorage;
  const key = `routeops.view.${list}`;
  const stored = storage?.getItem(key);
  const view = signal<ListView>(stored === 'cards' ? 'cards' : 'table');
  effect(() => storage?.setItem(key, view()));
  return view;
}

@Component({
  selector: 'app-view-switch',
  imports: [NgIcon],
  template: `
    @for (option of options; track option) {
      <button
        type="button"
        class="app-view-switch-option"
        [attr.aria-pressed]="view() === option"
        [attr.title]="text().view[option]"
        (click)="view.set(option)"
      >
        <ng-icon [svg]="icons[option]" aria-hidden="true" />
        <span>{{ text().view[option] }}</span>
      </button>
    }
  `,
  styleUrl: './view-switch.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-switch',
    role: 'group',
    '[attr.aria-label]': 'text().view.label',
  },
})
export class ViewSwitch {
  readonly view = model<ListView>('table');

  protected readonly text = injectText(uiText);
  protected readonly options = listViews;
  protected readonly icons: Record<ListView, string> = {
    table: lucideTable,
    cards: lucideLayoutGrid,
  };
}
