import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideLanguages,
  lucideShieldCheck,
  lucideSmartphone,
  lucideSparkles,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { ProductPreview } from './product-preview';
import { SiteActions } from './site-actions';
import { PromiseKey, promiseKeys, siteText } from './site-text';

const promiseIcons: Record<PromiseKey, string> = {
  languages: lucideLanguages,
  devices: lucideSmartphone,
  privacy: lucideShieldCheck,
};

@Component({
  selector: 'app-home-hero',
  imports: [NgIcon, ProductPreview, SiteActions],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.css',
})
export class HomeHero {
  protected readonly text = injectText(siteText);
  protected readonly icons = { sparkles: lucideSparkles };
  protected readonly promises = promiseKeys.map((key) => ({ key, icon: promiseIcons[key] }));
}
