import { Language } from '@routeops/shared/i18n';
import { SubscriptionOffer } from '@routeops/shared/pricing';
import { SiteText } from './site-text';

// What an offer gives in a few words: "خصم 20%" or "20% off", and "جرّب
// مجانًا لمدة 14 يومًا" or "Try it free for 14 days".
export function offerTerms(
  offer: SubscriptionOffer,
  text: SiteText['offers'],
  language: Language,
): string {
  if (offer.kind === 'trial') {
    return `${text.trial} ${dayCount(offer.trialDays ?? 0, text)}`;
  }
  return language === 'ar'
    ? `${text.off} ${offer.percentOff}%`
    : `${offer.percentOff}% ${text.off}`;
}

// Arabic counts one and two days in words, three to ten with the plural, and
// more with the singular.
function dayCount(days: number, text: SiteText['offers']): string {
  if (days === 1) {
    return text.days.one;
  }
  if (days === 2) {
    return text.days.two;
  }
  return `${days} ${days <= 10 ? text.days.few : text.days.many}`;
}
