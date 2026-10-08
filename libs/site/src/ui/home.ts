import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideChevronDown, lucideCircleCheck, lucideCircleX } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { PublicLayout } from '@routeops/shared/ui';
import { HomeFeatures } from './home-features';
import { HomeHero } from './home-hero';
import { SiteActions } from './site-actions';
import { siteText } from './site-text';

@Component({
  selector: 'app-home',
  imports: [HomeFeatures, HomeHero, NgIcon, PublicLayout, SiteActions],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly text = injectText(siteText);
  protected readonly icons = {
    check: lucideCircleCheck,
    cross: lucideCircleX,
    chevron: lucideChevronDown,
  };
}
