import { SubscriptionPeriod, SubscriptionPlan } from '@routeops/shared/pricing';

// The plans on offer and the discount for each subscription length.
export interface PriceList {
  readonly plans: readonly SubscriptionPlan[];
  readonly periods: readonly SubscriptionPeriod[];
}

export abstract class PricingRepository {
  abstract load(): Promise<PriceList>;
}
