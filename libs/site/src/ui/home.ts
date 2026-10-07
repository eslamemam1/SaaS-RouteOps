import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideBus,
  lucideCalendarCheck,
  lucideChartColumn,
  lucideLanguages,
  lucideReceipt,
  lucideShieldCheck,
  lucideSmartphone,
  lucideWallet,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Button, PublicLayout } from '@routeops/shared/ui';
import { FeatureKey, featureKeys, PromiseKey, promiseKeys, siteText } from './site-text';

const featureIcons: Record<FeatureKey, string> = {
  customers: lucideBuilding2,
  operations: lucideCalendarCheck,
  fleet: lucideBus,
  pay: lucideWallet,
  expenses: lucideReceipt,
  reports: lucideChartColumn,
};

const promiseIcons: Record<PromiseKey, string> = {
  languages: lucideLanguages,
  devices: lucideSmartphone,
  privacy: lucideShieldCheck,
};

@Component({
  selector: 'app-home',
  imports: [Button, NgIcon, PublicLayout, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly text = injectText(siteText);
  protected readonly features = featureKeys.map((key) => ({ key, icon: featureIcons[key] }));
  protected readonly promises = promiseKeys.map((key) => ({ key, icon: promiseIcons[key] }));
}
