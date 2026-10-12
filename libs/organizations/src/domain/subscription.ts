import { Currency, isCurrency, toMinorUnits } from '@routeops/shared/money';
import {
  isSubscriptionMonths,
  SubscriptionMonths,
} from '@routeops/shared/pricing';
import { CompanyAccount } from './organization';

// What a company bought: a plan for months from startsOn to endsOn, both
// included, with the vehicle limit and the price agreed for the whole period.
// A limit of null is no limit. price is in the company's smallest currency unit.
// A free trial has trialDays instead of months and a price of zero; offerId
// names the offer the operator applied, if any.
export interface OrganizationSubscription {
  readonly id: string;
  readonly organizationId: string;
  readonly planId: string;
  readonly months: SubscriptionMonths | null;
  readonly trialDays: number | null;
  readonly offerId: string | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly vehicleLimit: number | null;
  readonly price: number;
  readonly note: string;
}

// A company's active vehicles and its own today.
export interface VehicleUsage {
  readonly organizationId: string;
  readonly activeVehicles: number;
  readonly today: string;
}

// What the plan form edits. A blank limit is no limit, and a blank price is
// a price agreed per company.
export interface PlanDetails {
  readonly nameAr: string;
  readonly nameEn: string;
  readonly currency: Currency | '';
  readonly vehicleLimit: string;
  readonly monthlyPrice: string;
  readonly isActive: boolean;
}

// What the subscription form edits; price is typed in the company's currency.
// A blank offerId is no offer.
export interface SubscriptionDetails {
  readonly organizationId: string;
  readonly planId: string;
  readonly offerId: string;
  readonly months: string;
  readonly startsOn: string;
  readonly vehicleLimit: string;
  readonly price: string;
  readonly note: string;
}

export const subscriptionProblems = [
  'planName',
  'currency',
  'vehicleLimit',
  'monthlyPrice',
  'discount',
  'company',
  'plan',
  'months',
  'startsOn',
  'price',
  'noteLength',
  'planCurrency',
  'offer',
  'trialUsed',
  'offerName',
  'offerCode',
  'codeTaken',
  'percentOff',
  'trialDays',
  'offerPlans',
  'offerMonths',
  'endsOn',
  'load',
  'save',
  'remove',
] as const;

export type SubscriptionProblem = (typeof subscriptionProblems)[number];

export type SubscriptionStatus =
  | 'none'
  | 'upcoming'
  | 'active'
  | 'ending'
  | 'ended';

// A subscription with this many days or fewer left is about to end.
export const endingSoonDays = 14;
export const maximumPlanNameLength = 60;
export const maximumSubscriptionNoteLength = 500;
export const maximumDiscountPercent = 90;
const maximumVehicleLimit = 100000;

export interface CompanySubscription {
  readonly account: CompanyAccount;
  readonly current: OrganizationSubscription | null;
  readonly next: OrganizationSubscription | null;
  readonly status: SubscriptionStatus;
  readonly daysLeft: number | null;
  readonly activeVehicles: number;
  readonly vehicleLimit: number | null;
  readonly today: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const emptyPlanDetails: PlanDetails = {
  nameAr: '',
  nameEn: '',
  currency: 'EGP',
  vehicleLimit: '',
  monthlyPrice: '',
  isActive: true,
};

export function emptySubscriptionDetails(today: string): SubscriptionDetails {
  return {
    organizationId: '',
    planId: '',
    offerId: '',
    months: '1',
    startsOn: today,
    vehicleLimit: '',
    price: '',
    note: '',
  };
}

export function planNameError(value: string): SubscriptionProblem | null {
  const length = value.trim().length;
  return length === 0 || length > maximumPlanNameLength ? 'planName' : null;
}

export function planCurrencyError(value: string): SubscriptionProblem | null {
  return isCurrency(value) ? null : 'currency';
}

// A blank limit is no limit; otherwise a whole number of vehicles above zero.
export function vehicleLimit(text: string): number | null | undefined {
  const digits = latinDigits(text.trim());
  if (digits.length === 0) {
    return null;
  }
  if (!/^\d{1,6}$/.test(digits)) {
    return undefined;
  }
  const limit = Number(digits);
  return limit > 0 && limit <= maximumVehicleLimit ? limit : undefined;
}

export function vehicleLimitError(text: string): SubscriptionProblem | null {
  return vehicleLimit(text) === undefined ? 'vehicleLimit' : null;
}

// A blank monthly price is agreed per company; a price is above zero.
export function monthlyPriceError(
  text: string,
  currency: Currency | '',
): SubscriptionProblem | null {
  if (currency === '') {
    return null;
  }
  const minor = toMinorUnits(text, currency);
  return minor === null || (typeof minor === 'number' && minor > 0)
    ? null
    : 'monthlyPrice';
}

export function discountPercent(text: string): number | undefined {
  const digits = latinDigits(text.trim());
  if (!/^\d{1,2}$/.test(digits)) {
    return undefined;
  }
  const percent = Number(digits);
  return percent <= maximumDiscountPercent ? percent : undefined;
}

export function subscriptionCompanyError(
  value: string,
  accounts: readonly CompanyAccount[],
): SubscriptionProblem | null {
  return accounts.some((account) => account.id === value) ? null : 'company';
}

export function subscriptionMonthsError(
  value: string,
): SubscriptionProblem | null {
  return isSubscriptionMonths(Number(value)) ? null : 'months';
}

export function startsOnError(value: string): SubscriptionProblem | null {
  if (!datePattern.test(value)) {
    return 'startsOn';
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    ? null
    : 'startsOn';
}

// Before a company is chosen the price cannot be read, so it is not judged yet.
export function subscriptionPriceError(
  text: string,
  currency: Currency | null,
): SubscriptionProblem | null {
  if (currency === null) {
    return null;
  }
  const minor = toMinorUnits(text, currency);
  return typeof minor === 'number' && minor > 0 ? null : 'price';
}

export function subscriptionNoteError(
  value: string,
): SubscriptionProblem | null {
  return value.trim().length > maximumSubscriptionNoteLength
    ? 'noteLength'
    : null;
}

// The subscription whose limit is in force, as the database decides it: the
// latest that has started, even one that has ended.
export function currentSubscription(
  subscriptions: readonly OrganizationSubscription[],
  organizationId: string,
  today: string,
): OrganizationSubscription | null {
  return (
    subscriptions
      .filter(
        (item) =>
          item.organizationId === organizationId && item.startsOn <= today,
      )
      .sort((a, b) => b.startsOn.localeCompare(a.startsOn))[0] ?? null
  );
}

// The earliest subscription that starts after today.
export function nextSubscription(
  subscriptions: readonly OrganizationSubscription[],
  organizationId: string,
  today: string,
): OrganizationSubscription | null {
  return (
    subscriptions
      .filter(
        (item) =>
          item.organizationId === organizationId && item.startsOn > today,
      )
      .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0] ?? null
  );
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );
}

export function subscriptionStatus(
  current: OrganizationSubscription | null,
  next: OrganizationSubscription | null,
  today: string,
): SubscriptionStatus {
  if (current === null || current.endsOn < today) {
    if (next !== null) {
      return 'upcoming';
    }
    return current === null ? 'none' : 'ended';
  }
  return next === null && daysBetween(today, current.endsOn) < endingSoonDays
    ? 'ending'
    : 'active';
}

const statusOrder: Record<SubscriptionStatus, number> = {
  ended: 0,
  ending: 1,
  none: 2,
  upcoming: 3,
  active: 4,
};

// Every company with its subscription, the ones that need the operator first.
export function companySubscriptions(
  accounts: readonly CompanyAccount[],
  subscriptions: readonly OrganizationSubscription[],
  usage: readonly VehicleUsage[],
  fallbackToday: string,
): CompanySubscription[] {
  return accounts
    .map((account) => {
      const used = usage.find((item) => item.organizationId === account.id);
      const today = used?.today ?? fallbackToday;
      const current = currentSubscription(subscriptions, account.id, today);
      const next = nextSubscription(subscriptions, account.id, today);
      const status = subscriptionStatus(current, next, today);
      return {
        account,
        current,
        next,
        status,
        daysLeft:
          current !== null && current.endsOn >= today
            ? daysBetween(today, current.endsOn) + 1
            : null,
        activeVehicles: used?.activeVehicles ?? 0,
        vehicleLimit: current?.vehicleLimit ?? null,
        today,
      };
    })
    .sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        a.account.name.localeCompare(b.account.name),
    );
}

// A renewal starts the day after the last subscription bought ends, or today
// when none is running.
export function suggestedStart(company: CompanySubscription): string {
  const last = company.next ?? company.current;
  if (last === null || last.endsOn < company.today) {
    return company.today;
  }
  const day = new Date(`${last.endsOn}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

export function latinDigits(text: string): string {
  return text.replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x0660),
  );
}
