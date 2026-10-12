import { toMinorUnits } from '@routeops/shared/money';
import {
  isSubscriptionMonths,
  SubscriptionOffer,
  subscriptionOfferColumns,
  SubscriptionPeriod,
  SubscriptionPlan,
  subscriptionPlanColumns,
  toSubscriptionOffer,
  toSubscriptionPeriods,
  toSubscriptionPlan,
} from '@routeops/shared/pricing';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  offerCode,
  OfferDetails,
  offerPercent,
  trialDays,
} from '../domain/offer';
import { CompanyAccount } from '../domain/organization';
import {
  OrganizationSubscription,
  PlanDetails,
  SubscriptionDetails,
  SubscriptionProblem,
  vehicleLimit,
  VehicleUsage,
} from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { SubscriptionDatabase, SubscriptionRow } from './subscription-database';

const subscriptionColumns =
  'id, organization_id, plan_id, offer_id, months, trial_days, starts_on, ends_on, vehicle_limit, price, note';
// What the database raises: a plan priced in another currency, an offer that
// does not take the plan or period, a second trial, and an offer naming a
// plan that does not exist.
const databaseProblems: Record<string, SubscriptionProblem> = {
  plan_currency: 'planCurrency',
  offer_mismatch: 'offer',
  trial_used: 'trialUsed',
  offer_plans: 'offerPlans',
};
const uniqueViolation = '23505';

export class SupabaseSubscriptionRepository extends SubscriptionRepository {
  constructor(
    private readonly client: SupabaseClient<SubscriptionDatabase> | null,
  ) {
    super();
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.requireClient()
      .from('subscription_plans')
      .select(subscriptionPlanColumns);
    if (error) {
      throw new SubscriptionError('load');
    }
    return (data ?? [])
      .map(toSubscriptionPlan)
      .filter((plan): plan is SubscriptionPlan => plan !== null);
  }

  async savePlan(
    planId: string | null,
    details: PlanDetails,
  ): Promise<SubscriptionPlan> {
    if (details.currency === '') {
      throw new SubscriptionError('currency');
    }
    const limit = vehicleLimit(details.vehicleLimit);
    const price = toMinorUnits(details.monthlyPrice, details.currency);
    if (limit === undefined) {
      throw new SubscriptionError('vehicleLimit');
    }
    if (price === undefined || price === 0) {
      throw new SubscriptionError('monthlyPrice');
    }
    const columns = {
      currency: details.currency,
      name_ar: details.nameAr.trim(),
      name_en: details.nameEn.trim(),
      vehicle_limit: limit,
      monthly_price: price,
      is_active: details.isActive,
    };
    const table = this.requireClient().from('subscription_plans');
    const { data, error } = await (
      planId === null
        ? table.insert(columns)
        : table.update(columns).eq('id', planId)
    )
      .select(subscriptionPlanColumns)
      .single();
    const plan = data ? toSubscriptionPlan(data) : null;
    if (error || !plan) {
      throw new SubscriptionError('save');
    }
    return plan;
  }

  async listPeriods(): Promise<SubscriptionPeriod[]> {
    const { data, error } = await this.requireClient()
      .from('subscription_periods')
      .select('months, discount_percent');
    if (error) {
      throw new SubscriptionError('load');
    }
    return toSubscriptionPeriods(data ?? []);
  }

  // One month is always at full price, so only the longer periods change.
  async saveDiscounts(
    periods: readonly SubscriptionPeriod[],
  ): Promise<SubscriptionPeriod[]> {
    const client = this.requireClient();
    const results = await Promise.all(
      periods
        .filter((period) => period.months !== 1)
        .map((period) =>
          client
            .from('subscription_periods')
            .update({ discount_percent: period.discountPercent })
            .eq('months', period.months)
            .select('months'),
        ),
    );
    if (
      results.some((result) => result.error || (result.data ?? []).length === 0)
    ) {
      throw new SubscriptionError('save');
    }
    return this.listPeriods();
  }

  async listOffers(): Promise<SubscriptionOffer[]> {
    const { data, error } = await this.requireClient()
      .from('subscription_offers')
      .select(subscriptionOfferColumns)
      .order('starts_on', { ascending: false });
    if (error) {
      throw new SubscriptionError('load');
    }
    return (data ?? [])
      .map(toSubscriptionOffer)
      .filter((offer): offer is SubscriptionOffer => offer !== null);
  }

  async saveOffer(
    offerId: string | null,
    details: OfferDetails,
  ): Promise<SubscriptionOffer> {
    const code = offerCode(details.code);
    if (code === undefined) {
      throw new SubscriptionError('offerCode');
    }
    const percent =
      details.kind === 'percent' ? offerPercent(details.percentOff) : null;
    const days = details.kind === 'trial' ? trialDays(details.trialDays) : null;
    if (percent === undefined) {
      throw new SubscriptionError('percentOff');
    }
    if (days === undefined) {
      throw new SubscriptionError('trialDays');
    }
    const columns = {
      kind: details.kind,
      name_ar: details.nameAr.trim(),
      name_en: details.nameEn.trim(),
      code,
      percent_off: percent,
      trial_days: days,
      plan_ids: [...details.planIds],
      months: details.kind === 'percent' ? [...details.months] : [],
      starts_on: details.startsOn,
      ends_on: details.endsOn || null,
      is_active: details.isActive,
    };
    const table = this.requireClient().from('subscription_offers');
    const { data, error } = await (
      offerId === null
        ? table.insert(columns)
        : table.update(columns).eq('id', offerId)
    )
      .select(subscriptionOfferColumns)
      .single();
    const offer = data ? toSubscriptionOffer(data) : null;
    if (error || !offer) {
      throw new SubscriptionError(
        error?.code === uniqueViolation ? 'codeTaken' : problemOf(error),
      );
    }
    return offer;
  }

  async listSubscriptions(): Promise<OrganizationSubscription[]> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .select(subscriptionColumns)
      .order('starts_on', { ascending: false });
    if (error) {
      throw new SubscriptionError('load');
    }
    return (data ?? []).map(toSubscription);
  }

  async recordSubscription(
    account: CompanyAccount,
    details: SubscriptionDetails,
    offer: SubscriptionOffer | null,
  ): Promise<OrganizationSubscription> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .insert({
        organization_id: account.id,
        ...subscriptionChanges(account, details, offer),
      })
      .select(subscriptionColumns)
      .single();
    if (error || !data) {
      throw new SubscriptionError(problemOf(error));
    }
    return toSubscription(data);
  }

  async updateSubscription(
    subscriptionId: string,
    account: CompanyAccount,
    details: SubscriptionDetails,
    offer: SubscriptionOffer | null,
  ): Promise<OrganizationSubscription> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .update(subscriptionChanges(account, details, offer))
      .eq('id', subscriptionId)
      .eq('organization_id', account.id)
      .select(subscriptionColumns)
      .single();
    if (error || !data) {
      throw new SubscriptionError(problemOf(error));
    }
    return toSubscription(data);
  }

  async removeSubscription(subscriptionId: string): Promise<void> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .select('id');
    if (error || (data ?? []).length === 0) {
      throw new SubscriptionError('remove');
    }
  }

  async vehicleUsage(): Promise<VehicleUsage[]> {
    const { data, error } = await this.requireClient().rpc(
      'operator_vehicle_usage',
    );
    if (error) {
      throw new SubscriptionError('load');
    }
    return (data ?? []).map((row) => ({
      organizationId: row.organization_id,
      activeVehicles: row.active_vehicles,
      today: row.today,
    }));
  }

  private requireClient(): SupabaseClient<SubscriptionDatabase> {
    if (!this.client) {
      throw new SubscriptionError('load');
    }
    return this.client;
  }
}

// A trial has no months and no price; the database takes its days from the offer.
function subscriptionChanges(
  account: CompanyAccount,
  details: SubscriptionDetails,
  offer: SubscriptionOffer | null,
) {
  const limit = vehicleLimit(details.vehicleLimit);
  if (limit === undefined) {
    throw new SubscriptionError('vehicleLimit');
  }
  const common = {
    plan_id: details.planId,
    offer_id: offer?.id ?? null,
    starts_on: details.startsOn,
    vehicle_limit: limit,
    note: details.note.trim() || null,
  };
  if (offer?.kind === 'trial') {
    return { ...common, months: null, price: 0 };
  }
  const months = Number(details.months);
  const price = toMinorUnits(details.price, account.currency);
  if (!isSubscriptionMonths(months)) {
    throw new SubscriptionError('months');
  }
  if (typeof price !== 'number' || price <= 0) {
    throw new SubscriptionError('price');
  }
  return { ...common, months, price };
}

function problemOf(error: PostgrestError | null): SubscriptionProblem {
  return (error && databaseProblems[error.message]) || 'save';
}

function toSubscription(row: SubscriptionRow): OrganizationSubscription {
  const months =
    row.months === null || isSubscriptionMonths(row.months)
      ? row.months
      : undefined;
  if (months === undefined) {
    throw new SubscriptionError('load');
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    planId: row.plan_id,
    months,
    trialDays: row.trial_days,
    offerId: row.offer_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    vehicleLimit: row.vehicle_limit,
    price: Number(row.price),
    note: row.note ?? '',
  };
}
