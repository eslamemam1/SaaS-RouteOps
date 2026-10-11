import {
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideUserRound } from '@ng-icons/lucide';

export type AvatarSize = 'sm' | 'md' | 'lg';

// The person's photo, or a person icon when there is none or it fails to load,
// such as after its signed link expires. It is decorative because the name is
// always written next to it.
@Component({
  selector: 'app-avatar',
  imports: [NgIcon],
  template: `
    @if (photo(); as url) {
      <img [src]="url" alt="" (error)="failed.set(url)" />
    } @else {
      <ng-icon class="app-avatar-placeholder" [svg]="placeholderIcon" />
    }
  `,
  styleUrl: './avatar.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-avatar',
    'aria-hidden': 'true',
    '[attr.data-size]': 'size()',
  },
})
export class Avatar {
  readonly src = input<string | null>(null);
  readonly size = input<AvatarSize>('md');

  protected readonly placeholderIcon = lucideUserRound;
  protected readonly failed = signal<string | null>(null);
  protected readonly photo = computed(() => {
    const url = this.src();
    return url && url !== this.failed() ? url : null;
  });
}
