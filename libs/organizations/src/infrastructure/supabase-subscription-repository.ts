import { toMinorUnits } from '@routeops/shared/money';
import {
  isSubscriptionMonths,
  SubscriptionPeriod,
  SubscriptionPlan,
  subscriptionPlanColumns,
  toSubscriptionPeriods,
  toSubscriptionPlan,
} from '@routeops/shared/pricing';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { CompanyAccount } from '../domain/organization';
import {
  OrganizationSubscription,
  PlanDetails,
  SubscriptionDetails,
  vehicleLimit,
  VehicleUsage,
} from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { SubscriptionDatabase, SubscriptionRow } from './subscription-database';

const subscriptionColumns =
  'id, organization_id, plan_id, months, starts_on, ends_on, vehicle_limit, price, note';
// Raised by the database when the plan is priced in another currency.
const planCurrency = 'plan_currency';

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
  ): Promise<OrganizationSubscription> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .insert({
        organization_id: account.id,
        ...subscriptionChanges(account, details),
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
  ): Promise<OrganizationSubscription> {
    const { data, error } = await this.requireClient()
      .from('organization_subscriptions')
      .update(subscriptionChanges(account, details))
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

function subscriptionChanges(
  account: CompanyAccount,
  details: SubscriptionDetails,
) {
  const months = Number(details.months);
  const limit = vehicleLimit(details.vehicleLimit);
  const price = toMinorUnits(details.price, account.currency);
  if (!isSubscriptionMonths(months)) {
    throw new SubscriptionError('months');
  }
  if (limit === undefined) {
    throw new SubscriptionError('vehicleLimit');
  }
  if (typeof price !== 'number' || price <= 0) {
    throw new SubscriptionError('price');
  }
  return {
    plan_id: details.planId,
    months,
    starts_on: details.startsOn,
    vehicle_limit: limit,
    price,
    note: details.note.trim() || null,
  };
}

function problemOf(error: PostgrestError | null) {
  return error?.message === planCurrency ? 'planCurrency' : 'save';
}

function toSubscription(row: SubscriptionRow): OrganizationSubscription {
  if (!isSubscriptionMonths(row.months)) {
    throw new SubscriptionError('load');
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    planId: row.plan_id,
    months: row.months,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    vehicleLimit: row.vehicle_limit,
    price: Number(row.price),
    note: row.note ?? '',
  };
}
