import { Component, computed, input, ViewEncapsulation } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

// The person's photo, or the first letters of the name when there is none.
// It is decorative because the name is always written next to it.
@Component({
  selector: 'app-avatar',
  template: `
    @if (src(); as photo) {
      <img [src]="photo" alt="" />
    } @else {
      {{ initials() }}
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
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly size = input<AvatarSize>('md');

  protected readonly initials = computed(() => initialsOf(this.name()));
}

export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join('')
    .toLocaleUpperCase();
}
