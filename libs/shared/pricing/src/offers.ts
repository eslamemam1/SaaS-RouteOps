// The offers the operator runs to win companies. The public pages show the
// offers without a code and the operator's screen applies any offer to a
// subscription, so both read them and price them with the same rule.
import { isSubscriptionMonths, SubscriptionMonths } from './pricing';

export const offerKinds = ['percent', 'trial'] as const;

export type OfferKind = (typeof offerKinds)[number];

// A percent offer takes percentOff off the named plans for the named months,
// after the period's discount. A trial offer gives the named plans free for
// trialDays days. An offer runs from startsOn to endsOn, both included, or
// with no end; one with a code is applied only by the operator.
export interface SubscriptionOffer {
  readonly id: string;
  readonly kind: OfferKind;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly code: string | null;
  readonly percentOff: number | null;
  readonly trialDays: number | null;
  readonly planIds: readonly string[];
  readonly months: readonly SubscriptionMonths[];
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly isActive: boolean;
}

export interface SubscriptionOfferRow {
  readonly id: string;
  readonly kind: string;
  readonly name_ar: string;
  readonly name_en: string;
  readonly code: string | null;
  readonly percent_off: number | null;
  readonly trial_days: number | null;
  readonly plan_ids: string[];
  readonly months: number[];
  readonly starts_on: string;
  readonly ends_on: string | null;
  readonly is_active: boolean;
}

export const subscriptionOfferColumns =
  'id, kind, name_ar, name_en, code, percent_off, trial_days, plan_ids, months, starts_on, ends_on, is_active';

// An offer of a kind the product does not know is left out.
export function toSubscriptionOffer(
  row: SubscriptionOfferRow,
): SubscriptionOffer | null {
  const kind = offerKinds.find((item) => item === row.kind);
  if (!kind) {
    return null;
  }
  return {
    id: row.id,
    kind,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    code: row.code,
    percentOff: row.percent_off,
    trialDays: row.trial_days,
    planIds: row.plan_ids,
    months: row.months.filter(isSubscriptionMonths),
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
  };
}

export function offerRunsOn(offer: SubscriptionOffer, day: string): boolean {
  return (
    offer.isActive &&
    offer.startsOn <= day &&
    (offer.endsOn === null || day <= offer.endsOn)
  );
}

// A trial fits any period of its plans; a percent offer only its own periods.
export function offerFits(
  offer: SubscriptionOffer,
  planId: string,
  months: SubscriptionMonths | null,
): boolean {
  if (!offer.planIds.includes(planId)) {
    return false;
  }
  return (
    offer.kind === 'trial' || (months !== null && offer.months.includes(months))
  );
}

// A price less the offer, rounded down to a whole minor unit like the
// period's discount.
export function offerPrice(price: number, percentOff: number): number {
  return Math.floor((price * (100 - percentOff)) / 100);
}

// The largest percent off running on the day for this plan and period.
export function bestOffer(
  offers: readonly SubscriptionOffer[],
  planId: string,
  months: SubscriptionMonths,
  day: string,
): SubscriptionOffer | null {
  return (
    offers
      .filter(
        (offer) =>
          offer.kind === 'percent' &&
          offerRunsOn(offer, day) &&
          offerFits(offer, planId, months),
      )
      .sort((a, b) => (b.percentOff ?? 0) - (a.percentOff ?? 0))[0] ?? null
  );
}

// The offers running on the day, the largest percent first and trials after.
export function runningOffers(
  offers: readonly SubscriptionOffer[],
  day: string,
): SubscriptionOffer[] {
  return offers
    .filter((offer) => offerRunsOn(offer, day))
    .sort(
      (a, b) =>
        offerKinds.indexOf(a.kind) - offerKinds.indexOf(b.kind) ||
        (b.percentOff ?? 0) - (a.percentOff ?? 0) ||
        (b.trialDays ?? 0) - (a.trialDays ?? 0),
    );
}

export function offerName(
  offer: SubscriptionOffer,
  language: 'ar' | 'en',
): string {
  return language === 'ar' ? offer.nameAr : offer.nameEn;
}

// The browser's own date, for the public pages that have no organization.
export function localToday(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
