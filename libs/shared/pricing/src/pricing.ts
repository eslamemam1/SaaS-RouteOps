// The plans the site operator sells and what a subscription to one costs. The
// public pricing page shows these prices and the operator's screen suggests
// them for a company, so both use the same rule. Amounts are in the smallest
// currency unit.
import {
  currencies,
  Currency,
  currencyDecimals,
  isCurrency,
} from '@routeops/shared/money';

// How many months a company may pay for at once.
export const subscriptionMonths = [1, 3, 6, 12] as const;

export type SubscriptionMonths = (typeof subscriptionMonths)[number];

// A plan allows up to vehicleLimit active vehicles for monthlyPrice a month.
// Without a limit there is none, and without a price it is agreed per company.
export interface SubscriptionPlan {
  readonly id: string;
  readonly currency: Currency;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly vehicleLimit: number | null;
  readonly monthlyPrice: number | null;
  readonly isActive: boolean;
}

// The discount, in whole percent, for paying months at once.
export interface SubscriptionPeriod {
  readonly months: SubscriptionMonths;
  readonly discountPercent: number;
}

export interface SubscriptionPlanRow {
  readonly id: string;
  readonly currency: string;
  readonly name_ar: string;
  readonly name_en: string;
  readonly vehicle_limit: number | null;
  readonly monthly_price: number | null;
  readonly is_active: boolean;
}

export interface SubscriptionPeriodRow {
  readonly months: number;
  readonly discount_percent: number;
}

export const subscriptionPlanColumns =
  'id, currency, name_ar, name_en, vehicle_limit, monthly_price, is_active';

export function isSubscriptionMonths(
  value: number,
): value is SubscriptionMonths {
  return (subscriptionMonths as readonly number[]).includes(value);
}

// A plan in a currency the product does not support is left out.
export function toSubscriptionPlan(
  row: SubscriptionPlanRow,
): SubscriptionPlan | null {
  if (!isCurrency(row.currency)) {
    return null;
  }
  return {
    id: row.id,
    currency: row.currency,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    vehicleLimit: row.vehicle_limit,
    monthlyPrice: row.monthly_price === null ? null : Number(row.monthly_price),
    isActive: row.is_active,
  };
}

// Every period, shortest first; one the database does not list has no discount.
export function toSubscriptionPeriods(
  rows: readonly SubscriptionPeriodRow[],
): SubscriptionPeriod[] {
  return subscriptionMonths.map((months) => ({
    months,
    discountPercent:
      rows.find((row) => row.months === months)?.discount_percent ?? 0,
  }));
}

export function fullPrice(monthlyPrice: number, months: number): number {
  return monthlyPrice * months;
}

// The price of a period less its discount, rounded down to a whole minor unit
// so a company is never charged a fraction.
export function periodPrice(
  monthlyPrice: number,
  period: SubscriptionPeriod,
): number {
  return Math.floor(
    (fullPrice(monthlyPrice, period.months) * (100 - period.discountPercent)) /
      100,
  );
}

export function periodSaving(
  monthlyPrice: number,
  period: SubscriptionPeriod,
): number {
  return (
    fullPrice(monthlyPrice, period.months) - periodPrice(monthlyPrice, period)
  );
}

// The plans of a currency as a buyer compares them: the smallest limit first,
// and a plan without a limit last.
export function plansIn(
  plans: readonly SubscriptionPlan[],
  currency: Currency,
): SubscriptionPlan[] {
  return plans
    .filter((plan) => plan.currency === currency)
    .sort(
      (a, b) =>
        orderLast(a.vehicleLimit, b.vehicleLimit) ||
        orderLast(a.monthlyPrice, b.monthlyPrice) ||
        a.nameEn.localeCompare(b.nameEn),
    );
}

// The currencies that have at least one plan, in the product's order.
export function planCurrencies(plans: readonly SubscriptionPlan[]): Currency[] {
  return currencies.filter((currency) =>
    plans.some((plan) => plan.currency === currency),
  );
}

// The first of the sorted plans that takes this many vehicles.
export function planFor(
  plans: readonly SubscriptionPlan[],
  vehicles: number,
): SubscriptionPlan | null {
  return (
    plans.find(
      (plan) => plan.vehicleLimit === null || plan.vehicleLimit >= vehicles,
    ) ?? null
  );
}

export function planName(
  plan: SubscriptionPlan,
  language: 'ar' | 'en',
): string {
  return language === 'ar' ? plan.nameAr : plan.nameEn;
}

// The last day of a subscription, as the database counts it: the day before
// the same date months later, a day past the end of a shorter month moving
// back to its last day, so 2026-01-31 for one month ends 2026-02-27.
export function subscriptionEnd(startsOn: string, months: number): string {
  const [year, month, day] = startsOn.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay) - 1);
  return target.toISOString().slice(0, 10);
}

// A price as buyers read it: whole amounts without the zero fraction, such as
// 750 rather than 750.00, and any fraction in full.
export function formatPrice(
  minor: number,
  currency: Currency,
  language: 'ar' | 'en',
): string {
  const decimals = currencyDecimals[currency];
  const whole = minor % 10 ** decimals === 0;
  return new Intl.NumberFormat(
    language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : decimals,
      maximumFractionDigits: whole ? 0 : decimals,
    },
  ).format(minor / 10 ** decimals);
}

function orderLast(a: number | null, b: number | null): number {
  if (a === b) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  return a - b;
}
