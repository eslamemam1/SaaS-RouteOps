import {
  formatPrice,
  periodPrice,
  periodSaving,
  planCurrencies,
  planFor,
  plansIn,
  SubscriptionPlan,
  subscriptionEnd,
  toSubscriptionPeriods,
  toSubscriptionPlan,
} from './pricing';

const plan = (
  id: string,
  vehicleLimit: number | null,
  monthlyPrice: number | null,
  currency: SubscriptionPlan['currency'] = 'EGP',
): SubscriptionPlan => ({
  id,
  currency,
  nameAr: id,
  nameEn: id,
  vehicleLimit,
  monthlyPrice,
  isActive: true,
});

describe('pricing', () => {
  it('takes the discount off the months paid at once, never charging a fraction', () => {
    expect(periodPrice(75000, { months: 1, discountPercent: 0 })).toBe(75000);
    expect(periodPrice(75000, { months: 3, discountPercent: 10 })).toBe(202500);
    expect(periodPrice(33333, { months: 3, discountPercent: 15 })).toBe(84999);
    expect(periodSaving(33333, { months: 3, discountPercent: 15 })).toBe(15000);
  });

  it('reads plans and gives every period a discount', () => {
    expect(
      toSubscriptionPlan({
        id: 'p',
        currency: 'SAR',
        name_ar: 'بداية',
        name_en: 'Starter',
        vehicle_limit: 5,
        monthly_price: 30000,
        is_active: true,
      }),
    ).toEqual({
      id: 'p',
      currency: 'SAR',
      nameAr: 'بداية',
      nameEn: 'Starter',
      vehicleLimit: 5,
      monthlyPrice: 30000,
      isActive: true,
    });
    expect(
      toSubscriptionPlan({
        id: 'p',
        currency: 'USD',
        name_ar: '',
        name_en: '',
        vehicle_limit: null,
        monthly_price: null,
        is_active: true,
      }),
    ).toBeNull();
    expect(
      toSubscriptionPeriods([{ months: 12, discount_percent: 20 }]),
    ).toEqual([
      { months: 1, discountPercent: 0 },
      { months: 3, discountPercent: 0 },
      { months: 6, discountPercent: 0 },
      { months: 12, discountPercent: 20 },
    ]);
  });

  it('orders plans by limit and finds the one that fits a fleet', () => {
    const plans = [
      plan('large', null, null),
      plan('growth', 15, 180000),
      plan('riyal', 5, 30000, 'SAR'),
      plan('starter', 5, 75000),
    ];
    const pounds = plansIn(plans, 'EGP');
    expect(pounds.map((item) => item.id)).toEqual([
      'starter',
      'growth',
      'large',
    ]);
    expect(planFor(pounds, 3)?.id).toBe('starter');
    expect(planFor(pounds, 6)?.id).toBe('growth');
    expect(planFor(pounds, 40)?.id).toBe('large');
    expect(planFor(pounds.slice(0, 2), 40)).toBeNull();
    expect(planCurrencies(plans)).toEqual(['EGP', 'SAR']);
  });

  it('writes whole prices without a zero fraction', () => {
    const price = (...args: Parameters<typeof formatPrice>) =>
      formatPrice(...args).replace(/\s/g, ' ');
    expect(price(75000, 'EGP', 'en')).toBe('EGP 750');
    expect(price(75050, 'EGP', 'en')).toBe('EGP 750.50');
    expect(price(1500, 'KWD', 'en')).toBe('KWD 1.500');
  });

  it('ends a subscription the day before the same date months later', () => {
    expect(subscriptionEnd('2026-01-15', 3)).toBe('2026-04-14');
    expect(subscriptionEnd('2026-01-01', 1)).toBe('2026-01-31');
    expect(subscriptionEnd('2026-01-31', 1)).toBe('2026-02-27');
    expect(subscriptionEnd('2026-11-01', 12)).toBe('2027-10-31');
  });
});
