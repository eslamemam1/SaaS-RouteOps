import { booleanAttribute, Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectText, productName } from '@routeops/shared/i18n';
import { Button } from './button';
import { LanguageSwitch } from './language-switch';
import { Logo } from './logo';
import { uiText } from './ui-text';

// The frame of the pages a visitor sees before signing in. A fullWidth page
// lays out its own sections, so they can reach the edges of the screen.
@Component({
  selector: 'app-public-layout',
  imports: [Button, LanguageSwitch, Logo, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-public-layout' },
})
export class PublicLayout {
  protected readonly text = injectText(uiText);
  protected readonly brand = injectText(productName);
  protected readonly year = new Date().getFullYear();
  readonly fullWidth = input(false, { transform: booleanAttribute });
}
