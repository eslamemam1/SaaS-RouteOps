import {
  booleanAttribute,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideMenu, lucideX } from '@ng-icons/lucide';
import { injectText, productName } from '@routeops/shared/i18n';
import { Button } from './button';
import { LanguageSwitch } from './language-switch';
import { Logo } from './logo';
import { uiText } from './ui-text';

// The frame of the pages a visitor sees before signing in. A fullWidth page
// lays out its own sections, so they can reach the edges of the screen.
@Component({
  selector: 'app-public-layout',
  imports: [Button, LanguageSwitch, Logo, NgIcon, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-public-layout',
    '(document:keydown.escape)': 'closeMenu()',
    '(document:click)': 'closeOutside($event)',
  },
})
export class PublicLayout {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly text = injectText(uiText);
  protected readonly brand = injectText(productName);
  protected readonly year = new Date().getFullYear();
  protected readonly menuIcon = lucideMenu;
  protected readonly closeIcon = lucideX;
  protected readonly menuOpen = signal(false);
  readonly fullWidth = input(false, { transform: booleanAttribute });

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeOutside(event: MouseEvent): void {
    const header = this.host.nativeElement.querySelector('.app-public-header');
    if (!header?.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
