import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideArrowRight, lucideGift } from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import {
  localToday,
  offerName,
  runningOffers,
  SubscriptionOffer,
} from '@routeops/shared/pricing';
import { PricingRepository } from '../application/pricing-repository';
import { offerTerms } from './offer-terms';
import { siteText } from './site-text';

// The best offer running today, on the dark hero, linking to the prices. It
// shows nothing while loading, without an offer, or when the offers cannot be read.
@Component({
  selector: 'app-home-offer',
  imports: [NgIcon, RouterLink],
  template: `
    @if (shown(); as offer) {
      <a class="home-offer" routerLink="/pricing" [attr.data-offer]="offer.id">
        <span class="home-offer-terms">
          <ng-icon [svg]="icons.gift" aria-hidden="true" />
          {{ offer.terms }}
        </span>
        <span class="home-offer-name">
          {{ offer.name }}
          @if (offer.until) {
            · {{ text().offers.until }} <bdi>{{ offer.until }}</bdi>
          }
        </span>
        <span class="home-offer-see">
          {{ text().offers.see }}
          <ng-icon
            class="home-offer-arrow"
            [svg]="icons.arrow"
            aria-hidden="true"
          />
        </span>
      </a>
    }
  `,
  styleUrl: './home-offer.css',
})
export class HomeOffer {
  private readonly repository = inject(PricingRepository);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(siteText);
  protected readonly icons = { gift: lucideGift, arrow: lucideArrowRight };
  private readonly offer = signal<SubscriptionOffer | null>(null);
  protected readonly shown = computed(() => {
    const offer = this.offer();
    const language = this.language();
    return offer === null
      ? null
      : {
          id: offer.id,
          terms: offerTerms(offer, this.text().offers, language),
          name: offerName(offer, language),
          until: offer.endsOn ? formatDay(offer.endsOn, language) : null,
        };
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const offers = await this.repository.offers();
      this.offer.set(runningOffers(offers, localToday())[0] ?? null);
    } catch {
      this.offer.set(null);
    }
  }
}
