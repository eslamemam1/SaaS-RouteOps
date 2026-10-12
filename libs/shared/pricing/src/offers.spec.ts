import {
  bestOffer,
  localToday,
  offerFits,
  offerPrice,
  offerRunsOn,
  runningOffers,
  SubscriptionOffer,
  toSubscriptionOffer,
} from './offers';
import { periodPrice } from './pricing';

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
  months: [3, 6],
  startsOn: '2026-10-01',
  endsOn: '2026-10-31',
  isActive: true,
  ...changes,
});

describe('offers', () => {
  it('runs between its days, both included, and only while active', () => {
    const running = offer('autumn');

    expect(offerRunsOn(running, '2026-09-30')).toBe(false);
    expect(offerRunsOn(running, '2026-10-01')).toBe(true);
    expect(offerRunsOn(running, '2026-10-31')).toBe(true);
    expect(offerRunsOn(running, '2026-11-01')).toBe(false);
    expect(offerRunsOn(offer('open', { endsOn: null }), '2030-01-01')).toBe(
      true,
    );
    expect(
      offerRunsOn(offer('stopped', { isActive: false }), '2026-10-10'),
    ).toBe(false);
  });

  it('fits its plans, and a percent offer only its periods', () => {
    const percent = offer('autumn');
    const trial = offer('trial', {
      kind: 'trial',
      percentOff: null,
      trialDays: 14,
      months: [],
    });

    expect(offerFits(percent, 'starter', 3)).toBe(true);
    expect(offerFits(percent, 'starter', 1)).toBe(false);
    expect(offerFits(percent, 'growth', 3)).toBe(false);
    expect(offerFits(trial, 'starter', null)).toBe(true);
    expect(offerFits(trial, 'growth', null)).toBe(false);
  });

  it('comes off after the period discount, never charging a fraction', () => {
    const afterPeriod = periodPrice(75000, { months: 3, discountPercent: 10 });

    expect(afterPeriod).toBe(202500);
    expect(offerPrice(afterPeriod, 20)).toBe(162000);
    expect(offerPrice(999, 15)).toBe(849);
  });

  it('picks the largest percent off running for the plan and period', () => {
    const offers = [
      offer('small', { percentOff: 10 }),
      offer('large', { percentOff: 25 }),
      offer('ended', { percentOff: 50, endsOn: '2026-09-30' }),
      offer('yearly', { percentOff: 40, months: [12] }),
    ];

    expect(bestOffer(offers, 'starter', 3, '2026-10-10')?.id).toBe('large');
    expect(bestOffer(offers, 'starter', 1, '2026-10-10')).toBeNull();
  });

  it('lists the running offers, percent off first and trials after', () => {
    const offers = [
      offer('trial', { kind: 'trial', percentOff: null, trialDays: 14 }),
      offer('small', { percentOff: 10 }),
      offer('large', { percentOff: 25 }),
      offer('later', { startsOn: '2026-11-01', endsOn: null }),
    ];

    expect(runningOffers(offers, '2026-10-10').map((item) => item.id)).toEqual([
      'large',
      'small',
      'trial',
    ]);
  });

  it('reads an offer from the database and leaves out an unknown kind', () => {
    const row = {
      id: 'autumn',
      kind: 'percent',
      name_ar: 'خريف',
      name_en: 'Autumn',
      code: null,
      percent_off: 20,
      trial_days: null,
      plan_ids: ['starter'],
      months: [3, 5, 6],
      starts_on: '2026-10-01',
      ends_on: null,
      is_active: true,
    };

    expect(toSubscriptionOffer(row)?.months).toEqual([3, 6]);
    expect(toSubscriptionOffer({ ...row, kind: 'gift' })).toBeNull();
  });

  it('gives the browser its own date', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
