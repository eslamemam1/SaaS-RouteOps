import { Component, computed, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideRepeat, lucideTrendingUp } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import { siteText } from './site-text';

// An illustration of the product, so its figures are samples.
const sampleProfit = 2_875_000;
export const sampleBars = [34, 48, 42, 61, 55, 78, 92];

@Component({
  selector: 'app-product-preview',
  imports: [NgIcon],
  templateUrl: './product-preview.html',
  styleUrl: './product-preview.css',
  host: { 'aria-hidden': 'true' },
})
export class ProductPreview {
  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(siteText);
  protected readonly swapIcon = lucideRepeat;
  protected readonly trendIcon = lucideTrendingUp;
  protected readonly bars = sampleBars;
  protected readonly profit = computed(() => formatMoney(sampleProfit, 'EGP', this.language()));
}
