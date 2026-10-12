import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  SubscriptionOffer,
  subscriptionOfferColumns,
  SubscriptionPlan,
  subscriptionPlanColumns,
  toSubscriptionOffer,
  toSubscriptionPeriods,
  toSubscriptionPlan,
} from '@routeops/shared/pricing';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  PriceList,
  PricingRepository,
} from '../application/pricing-repository';
import { Database } from './database';

// Reads only the plans on offer and the active offers without a code, even
// for the operator, who may also read the hidden ones.
export class SupabasePricingRepository extends PricingRepository {
  constructor(private readonly client: SupabaseClient<Database> | null) {
    super();
  }

  async load(): Promise<PriceList> {
    const client = this.requireClient();
    const [plans, periods, offers] = await Promise.all([
      client
        .from('subscription_plans')
        .select(subscriptionPlanColumns)
        .eq('is_active', true),
      client.from('subscription_periods').select('months, discount_percent'),
      // The prices still show when the offers cannot be read.
      this.offers().catch((): SubscriptionOffer[] => []),
    ]);
    if (plans.error || periods.error) {
      throw new Error('load');
    }
    return {
      plans: (plans.data ?? [])
        .map(toSubscriptionPlan)
        .filter((plan): plan is SubscriptionPlan => plan !== null),
      periods: toSubscriptionPeriods(periods.data ?? []),
      offers,
    };
  }

  async offers(): Promise<SubscriptionOffer[]> {
    const { data, error } = await this.requireClient()
      .from('subscription_offers')
      .select(subscriptionOfferColumns)
      .eq('is_active', true)
      .is('code', null);
    if (error) {
      throw new Error('load');
    }
    return (data ?? [])
      .map(toSubscriptionOffer)
      .filter((offer): offer is SubscriptionOffer => offer !== null);
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error('notConnected');
    }
    return this.client;
  }
}

export function providePricing(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PricingRepository,
      useFactory: () =>
        new SupabasePricingRepository(
          inject(SUPABASE_CLIENT) as SupabaseClient<Database> | null,
        ),
    },
  ]);
}
