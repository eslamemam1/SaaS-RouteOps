import { Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideBus,
  lucideCalendarCheck,
  lucideChartColumn,
  lucideReceipt,
  lucideWallet,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { sampleBars } from './product-preview';
import { FeatureKey, siteText } from './site-text';

const smallFeatures: readonly { key: FeatureKey; icon: string }[] = [
  { key: 'customers', icon: lucideBuilding2 },
  { key: 'fleet', icon: lucideBus },
  { key: 'pay', icon: lucideWallet },
  { key: 'expenses', icon: lucideReceipt },
];

@Component({
  selector: 'app-home-features',
  imports: [NgIcon],
  templateUrl: './home-features.html',
  styleUrl: './home-features.css',
})
export class HomeFeatures {
  protected readonly text = injectText(siteText);
  protected readonly icons = { operations: lucideCalendarCheck, reports: lucideChartColumn };
  protected readonly smallFeatures = smallFeatures;
  protected readonly bars = sampleBars;
}
