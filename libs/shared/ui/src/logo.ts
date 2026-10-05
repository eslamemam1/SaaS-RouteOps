import { Component, input } from '@angular/core';

export type LogoVariant = 'full' | 'compact';
export type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-logo',
  styleUrl: './logo.css',
  host: { 'aria-hidden': 'true', '[attr.data-size]': 'size()' },
  template: `
    <svg viewBox="0 0 64 64" focusable="false">
      <rect class="app-logo-tile" width="64" height="64" rx="15" />
      @if (variant() === 'full') {
        <path class="app-logo-route" d="M46 17 C46 31 24 26 22 36" stroke-width="5" />
        <circle class="app-logo-stop" cx="46" cy="16" r="5" stroke-width="4" />
        <circle class="app-logo-stop" cx="35" cy="27.2" r="3.6" stroke-width="3.2" />
      } @else {
        <path class="app-logo-route" d="M46 17 C46 30 26 27 23 37" stroke-width="5.5" />
        <circle class="app-logo-stop" cx="46" cy="16" r="5.5" stroke-width="4.5" />
      }
      <circle class="app-logo-arrival" cx="21" cy="45" r="10" />
      <path class="app-logo-check" d="M16.5 45 L20 48.5 L26 42" stroke-width="3.5" />
    </svg>
  `,
})
export class Logo {
  readonly variant = input<LogoVariant>('full');
  readonly size = input<LogoSize>('md');
}
