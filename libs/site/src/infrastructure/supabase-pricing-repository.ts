import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import {
  SubscriptionPlan,
  subscriptionPlanColumns,
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

// Reads only the plans on offer, even for the operator, who may also read the
// ones no longer sold.
export class SupabasePricingRepository extends PricingRepository {
  constructor(private readonly client: SupabaseClient<Database> | null) {
    super();
  }

  async load(): Promise<PriceList> {
    if (!this.client) {
      throw new Error('notConnected');
    }
    const [plans, periods] = await Promise.all([
      this.client
        .from('subscription_plans')
        .select(subscriptionPlanColumns)
        .eq('is_active', true),
      this.client
        .from('subscription_periods')
        .select('months, discount_percent'),
    ]);
    if (plans.error || periods.error) {
      throw new Error('load');
    }
    return {
      plans: (plans.data ?? [])
        .map(toSubscriptionPlan)
        .filter((plan): plan is SubscriptionPlan => plan !== null),
      periods: toSubscriptionPeriods(periods.data ?? []),
    };
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
