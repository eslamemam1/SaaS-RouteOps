import { booleanAttribute, Component, input } from '@angular/core';

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'app-tag',
  template: `@if (dot()) {
      <span class="dot" aria-hidden="true"></span>
    }
    <ng-content />`,
  styleUrl: './tag.css',
  host: { '[attr.data-tone]': 'tone()' },
})
export class Tag {
  readonly tone = input<Tone>('neutral');
  readonly dot = input(false, { transform: booleanAttribute });
}
