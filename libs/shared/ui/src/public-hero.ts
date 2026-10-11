import { Component, ViewEncapsulation } from '@angular/core';

let nextId = 0;

// The dark band with glows, a faint grid, and a moving route line that opens
// every public page. Pages put their own content inside and may use the
// app-hero-* text classes so headings look the same everywhere.
@Component({
  selector: 'app-public-hero',
  template: `
    <div class="app-hero-backdrop" aria-hidden="true">
      <svg class="app-hero-route" viewBox="0 0 1200 640" preserveAspectRatio="none">
        <path
          class="app-hero-route-path"
          [attr.id]="pathId"
          d="M-40 560 C 180 470 300 600 520 470 S 840 300 1000 330 S 1180 190 1260 140"
        />
        <circle class="app-hero-route-bus" r="7">
          <animateMotion dur="14s" repeatCount="indefinite">
            <mpath [attr.href]="'#' + pathId" />
          </animateMotion>
        </circle>
      </svg>
    </div>
    <div class="app-hero-inner"><ng-content /></div>
  `,
  styleUrl: './public-hero.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-hero' },
})
export class PublicHero {
  protected readonly pathId = `app-hero-route-${nextId++}`;
}
