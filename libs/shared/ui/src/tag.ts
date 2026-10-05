import { Component, input } from '@angular/core';

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'app-tag',
  template: '<ng-content />',
  styleUrl: './tag.css',
  host: { '[attr.data-tone]': 'tone()' },
})
export class Tag {
  readonly tone = input<Tone>('neutral');
}
