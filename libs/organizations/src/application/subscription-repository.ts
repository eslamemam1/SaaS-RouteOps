import { SubscriptionPeriod, SubscriptionPlan } from '@routeops/shared/pricing';
import { CompanyAccount } from '../domain/organization';
import {
  OrganizationSubscription,
  PlanDetails,
  SubscriptionDetails,
  VehicleUsage,
} from '../domain/subscription';

// The plans the operator sells and the subscriptions companies bought. Only
// the operator uses it.
export abstract class SubscriptionRepository {
  abstract listPlans(): Promise<SubscriptionPlan[]>;
  abstract savePlan(
    planId: string | null,
    details: PlanDetails,
  ): Promise<SubscriptionPlan>;
  abstract listPeriods(): Promise<SubscriptionPeriod[]>;
  abstract saveDiscounts(
    periods: readonly SubscriptionPeriod[],
  ): Promise<SubscriptionPeriod[]>;
  abstract listSubscriptions(): Promise<OrganizationSubscription[]>;
  abstract recordSubscription(
    account: CompanyAccount,
    details: SubscriptionDetails,
  ): Promise<OrganizationSubscription>;
  abstract updateSubscription(
    subscriptionId: string,
    account: CompanyAccount,
    details: SubscriptionDetails,
  ): Promise<OrganizationSubscription>;
  abstract removeSubscription(subscriptionId: string): Promise<void>;
  abstract vehicleUsage(): Promise<VehicleUsage[]>;
}
