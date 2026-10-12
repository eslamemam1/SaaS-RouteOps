import {
  SubscriptionOffer,
  SubscriptionPeriod,
  SubscriptionPlan,
} from '@routeops/shared/pricing';

// The plans on offer, the discount for each subscription length, and the
// public offers.
export interface PriceList {
  readonly plans: readonly SubscriptionPlan[];
  readonly periods: readonly SubscriptionPeriod[];
  readonly offers: readonly SubscriptionOffer[];
}

export abstract class PricingRepository {
  abstract load(): Promise<PriceList>;
  abstract offers(): Promise<SubscriptionOffer[]>;
}
