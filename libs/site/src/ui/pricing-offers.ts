import { Component, computed, inject, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideGift } from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import {
  offerName,
  planName,
  SubscriptionOffer,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import { offerTerms } from './offer-terms';
import { siteText } from './site-text';

// The running offers above the plans: what each gives, on which plans and
// periods, and until when.
@Component({
  selector: 'app-pricing-offers',
  imports: [NgIcon],
  template: `
    <h2 class="pricing-offers-label">{{ text().offers.label }}</h2>
    <ul class="pricing-offers">
      @for (item of items(); track item.id) {
        <li class="pricing-offer" [attr.data-offer]="item.id">
          <span class="pricing-offer-icon" aria-hidden="true">
            <ng-icon [svg]="giftIcon" />
          </span>
          <div class="pricing-offer-copy">
            <p class="pricing-offer-title">
              <strong>{{ item.terms }}</strong>
              <span>{{ item.name }}</span>
            </p>
            <p class="pricing-offer-hint">
              {{ text().offers.onPlans }} <bdi>{{ item.plans }}</bdi>
              @if (item.periods) {
                · {{ text().offers.forPeriods }} {{ item.periods }}
              }
              @if (item.until) {
                · {{ text().offers.until }} <bdi>{{ item.until }}</bdi>
              }
            </p>
          </div>
        </li>
      }
    </ul>
  `,
  styleUrl: './pricing-offers.css',
  host: { role: 'region', '[attr.aria-label]': 'text().offers.label' },
})
export class PricingOffers {
  private readonly language = inject(LanguageService).language;

  readonly offers = input.required<readonly SubscriptionOffer[]>();
  readonly plans = input.required<readonly SubscriptionPlan[]>();

  protected readonly text = injectText(siteText);
  protected readonly giftIcon = lucideGift;
  protected readonly items = computed(() => {
    const language = this.language();
    const text = this.text();
    const separator = language === 'ar' ? '، ' : ', ';
    return this.offers().map((offer) => ({
      id: offer.id,
      terms: offerTerms(offer, text.offers, language),
      name: offerName(offer, language),
      plans: this.plans()
        .filter((plan) => offer.planIds.includes(plan.id))
        .map((plan) => planName(plan, language))
        .join(separator),
      periods:
        offer.kind === 'percent'
          ? offer.months
              .map((months) => text.pricing.periods[months])
              .join(` ${text.offers.or} `)
          : '',
      until: offer.endsOn ? formatDay(offer.endsOn, language) : null,
    }));
  });
}
