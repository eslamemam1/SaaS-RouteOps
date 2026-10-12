import {
  OfferKind,
  offerRunsOn,
  SubscriptionMonths,
  SubscriptionOffer,
} from '@routeops/shared/pricing';
import {
  CompanySubscription,
  latinDigits,
  maximumPlanNameLength,
  startsOnError,
  SubscriptionProblem,
} from './subscription';

// What the offer form edits. A blank code makes the offer public, and a blank
// last day leaves it running until the operator stops it.
export interface OfferDetails {
  readonly kind: OfferKind;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly code: string;
  readonly percentOff: string;
  readonly trialDays: string;
  readonly planIds: readonly string[];
  readonly months: readonly SubscriptionMonths[];
  readonly startsOn: string;
  readonly endsOn: string;
  readonly isActive: boolean;
}

export type OfferStatus = 'running' | 'upcoming' | 'ended' | 'stopped';

export const maximumOfferPercent = 90;
export const maximumTrialDays = 90;
const codePattern = /^[A-Z0-9-]{3,20}$/;

export function emptyOfferDetails(today: string): OfferDetails {
  return {
    kind: 'percent',
    nameAr: '',
    nameEn: '',
    code: '',
    percentOff: '',
    trialDays: '14',
    planIds: [],
    months: [],
    startsOn: today,
    endsOn: '',
    isActive: true,
  };
}

export function offerDetails(offer: SubscriptionOffer): OfferDetails {
  return {
    kind: offer.kind,
    nameAr: offer.nameAr,
    nameEn: offer.nameEn,
    code: offer.code ?? '',
    percentOff: offer.percentOff === null ? '' : String(offer.percentOff),
    trialDays: offer.trialDays === null ? '' : String(offer.trialDays),
    planIds: offer.planIds,
    months: offer.months,
    startsOn: offer.startsOn,
    endsOn: offer.endsOn ?? '',
    isActive: offer.isActive,
  };
}

export function offerNameError(value: string): SubscriptionProblem | null {
  const length = value.trim().length;
  return length === 0 || length > maximumPlanNameLength ? 'offerName' : null;
}

// A code is read in capitals so a company may say it in any case; blank is
// no code.
export function offerCode(text: string): string | null | undefined {
  const code = latinDigits(text.trim()).toUpperCase();
  if (code.length === 0) {
    return null;
  }
  return codePattern.test(code) ? code : undefined;
}

export function offerCodeError(text: string): SubscriptionProblem | null {
  return offerCode(text) === undefined ? 'offerCode' : null;
}

export function offerPercent(text: string): number | undefined {
  return wholeNumber(text, maximumOfferPercent);
}

export function trialDays(text: string): number | undefined {
  return wholeNumber(text, maximumTrialDays);
}

export function offerPlansError(
  planIds: readonly string[],
): SubscriptionProblem | null {
  return planIds.length === 0 ? 'offerPlans' : null;
}

// A trial is not tied to a period, so only a percent offer names its periods.
export function offerMonthsError(
  kind: OfferKind,
  months: readonly SubscriptionMonths[],
): SubscriptionProblem | null {
  return kind === 'percent' && months.length === 0 ? 'offerMonths' : null;
}

export function offerEndsOnError(
  startsOn: string,
  endsOn: string,
): SubscriptionProblem | null {
  if (endsOn === '') {
    return null;
  }
  return startsOnError(endsOn) !== null || endsOn < startsOn ? 'endsOn' : null;
}

export function offerStatus(
  offer: SubscriptionOffer,
  today: string,
): OfferStatus {
  if (!offer.isActive) {
    return 'stopped';
  }
  if (offer.startsOn > today) {
    return 'upcoming';
  }
  return offerRunsOn(offer, today) ? 'running' : 'ended';
}

// A free trial is for a company that has bought nothing yet, so no other
// subscription of the company may be a trial or start by the trial's start.
export function trialAllowed(
  company: CompanySubscription,
  startsOn: string,
  subscriptionId: string | null,
): boolean {
  return [company.current, company.next].every(
    (other) =>
      other === null ||
      other.id === subscriptionId ||
      (other.trialDays === null && other.startsOn > startsOn),
  );
}

// The offers the operator may apply to a company's subscription of a plan:
// those running on the company's today, a trial only while the company may
// have one, and the offer a corrected subscription already has.
export function offersFor(
  offers: readonly SubscriptionOffer[],
  options: {
    readonly planId: string;
    readonly today: string;
    readonly trialAllowed: boolean;
    readonly keptOfferId: string | null;
  },
): SubscriptionOffer[] {
  return offers.filter(
    (offer) =>
      offer.planIds.includes(options.planId) &&
      (offer.id === options.keptOfferId ||
        (offerRunsOn(offer, options.today) &&
          (offer.kind === 'percent' || options.trialAllowed))),
  );
}

function wholeNumber(text: string, maximum: number): number | undefined {
  const digits = latinDigits(text.trim());
  if (!/^\d{1,3}$/.test(digits)) {
    return undefined;
  }
  const value = Number(digits);
  return value > 0 && value <= maximum ? value : undefined;
}
