import { SubscriptionOffer } from '@routeops/shared/pricing';
import {
  offerCode,
  offerCodeError,
  offerEndsOnError,
  offerPercent,
  offersFor,
  offerStatus,
  trialAllowed,
} from './offer';
import { CompanySubscription, OrganizationSubscription } from './subscription';

const offer = (
  id: string,
  changes: Partial<SubscriptionOffer> = {},
): SubscriptionOffer => ({
  id,
  kind: 'percent',
  nameAr: id,
  nameEn: id,
  code: null,
  percentOff: 20,
  trialDays: null,
  planIds: ['starter'],
  months: [3],
  startsOn: '2026-10-01',
  endsOn: '2026-10-31',
  isActive: true,
  ...changes,
});

const subscription = (
  id: string,
  startsOn: string,
  trialDays: number | null = null,
): OrganizationSubscription => ({
  id,
  organizationId: 'org',
  planId: 'starter',
  months: trialDays === null ? 1 : null,
  trialDays,
  offerId: null,
  startsOn,
  endsOn: startsOn,
  vehicleLimit: 5,
  price: trialDays === null ? 75_000 : 0,
  note: '',
});

const company = (
  current: OrganizationSubscription | null,
  next: OrganizationSubscription | null = null,
): CompanySubscription => ({
  account: {
    id: 'org',
    name: 'Nile',
    currency: 'EGP',
    isActive: true,
    logins: [],
    createdAt: '2026-01-01T09:00:00Z',
    lastSignInAt: null,
  },
  current,
  next,
  status: 'active',
  daysLeft: null,
  activeVehicles: 3,
  vehicleLimit: 5,
  today: '2026-10-12',
});

describe('offer rules', () => {
  it('reads a code in capitals and Latin digits, and blank as no code', () => {
    expect(offerCode('  autumn-٢٦ ')).toBe('AUTUMN-26');
    expect(offerCode('')).toBeNull();
    expect(offerCode('ab')).toBeUndefined();
    expect(offerCode('خصم')).toBeUndefined();
  });

  it('asks for a code only when the offer is kept for companies that give one', () => {
    expect(offerCodeError('')).toBeNull();
    expect(offerCodeError('', true)).toBe('offerCode');
    expect(offerCodeError('vip30', true)).toBeNull();
  });

  it('takes a percent from 1 to 90 and a last day on or after the first', () => {
    expect(offerPercent('٢٥')).toBe(25);
    expect(offerPercent('0')).toBeUndefined();
    expect(offerPercent('91')).toBeUndefined();
    expect(offerEndsOnError('2026-10-01', '')).toBeNull();
    expect(offerEndsOnError('2026-10-01', '2026-10-01')).toBeNull();
    expect(offerEndsOnError('2026-10-01', '2026-09-30')).toBe('endsOn');
  });

  it('tells a running offer from one that has not started, ended, or stopped', () => {
    expect(offerStatus(offer('a'), '2026-10-12')).toBe('running');
    expect(offerStatus(offer('a'), '2026-09-12')).toBe('upcoming');
    expect(offerStatus(offer('a'), '2026-11-01')).toBe('ended');
    expect(offerStatus(offer('a', { isActive: false }), '2026-10-12')).toBe(
      'stopped',
    );
  });

  it('allows a trial only before any other subscription and without an earlier trial', () => {
    expect(trialAllowed(company(null), '2026-10-12', null)).toBe(true);
    expect(
      trialAllowed(
        company(subscription('paid', '2026-09-01')),
        '2026-10-12',
        null,
      ),
    ).toBe(false);
    expect(
      trialAllowed(
        company(null, subscription('later', '2026-11-01')),
        '2026-10-12',
        null,
      ),
    ).toBe(true);
    expect(
      trialAllowed(
        company(null, subscription('trial', '2026-11-01', 14)),
        '2026-10-12',
        null,
      ),
    ).toBe(false);
    expect(
      trialAllowed(
        company(subscription('trial', '2026-10-01', 14)),
        '2026-10-01',
        'trial',
      ),
    ).toBe(true);
  });

  it('offers what runs on the plan, a trial only when allowed, and keeps a corrected subscription’s offer', () => {
    const offers = [
      offer('percent'),
      offer('trial', { kind: 'trial', percentOff: null, trialDays: 14 }),
      offer('ended', { endsOn: '2026-09-30' }),
      offer('growth', { planIds: ['growth'] }),
    ];
    const ids = (trial: boolean, kept: string | null) =>
      offersFor(offers, {
        planId: 'starter',
        today: '2026-10-12',
        trialAllowed: trial,
        keptOfferId: kept,
      }).map((item) => item.id);

    expect(ids(true, null)).toEqual(['percent', 'trial']);
    expect(ids(false, null)).toEqual(['percent']);
    expect(ids(false, 'ended')).toEqual(['percent', 'ended']);
  });
});
