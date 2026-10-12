import { CompanyAccount } from './organization';
import {
  companySubscriptions,
  discountPercent,
  monthlyPriceError,
  OrganizationSubscription,
  startsOnError,
  subscriptionPriceError,
  subscriptionStatus,
  suggestedStart,
  vehicleLimit,
} from './subscription';

const account = (id: string, name: string): CompanyAccount => ({
  id,
  name,
  currency: 'EGP',
  isActive: true,
  logins: [],
  createdAt: '2026-01-01T09:00:00Z',
  lastSignInAt: null,
});
const subscription = (
  organizationId: string,
  startsOn: string,
  endsOn: string,
  vehicleLimit: number | null = 5,
): OrganizationSubscription => ({
  id: `${organizationId}-${startsOn}`,
  organizationId,
  planId: 'plan',
  months: 1,
  startsOn,
  endsOn,
  vehicleLimit,
  price: 75_000,
  note: '',
});

describe('subscription rules', () => {
  it('reads a vehicle limit as none when blank and refuses anything but a count above zero', () => {
    expect(vehicleLimit('')).toBeNull();
    expect(vehicleLimit(' ١٢ ')).toBe(12);
    expect(vehicleLimit('0')).toBeUndefined();
    expect(vehicleLimit('2.5')).toBeUndefined();
  });

  it('accepts a discount from 0 to 90 percent', () => {
    expect(discountPercent('0')).toBe(0);
    expect(discountPercent('٢٠')).toBe(20);
    expect(discountPercent('91')).toBeUndefined();
    expect(discountPercent('')).toBeUndefined();
  });

  it('lets a plan go without a monthly price but not with a zero one', () => {
    expect(monthlyPriceError('', 'EGP')).toBeNull();
    expect(monthlyPriceError('750.50', 'EGP')).toBeNull();
    expect(monthlyPriceError('0', 'EGP')).toBe('monthlyPrice');
    expect(monthlyPriceError('7.505', 'EGP')).toBe('monthlyPrice');
  });

  it('needs a price above zero once the company is known', () => {
    expect(subscriptionPriceError('', null)).toBeNull();
    expect(subscriptionPriceError('', 'EGP')).toBe('price');
    expect(subscriptionPriceError('2025', 'EGP')).toBeNull();
  });

  it('refuses a date that does not exist', () => {
    expect(startsOnError('2026-02-28')).toBeNull();
    expect(startsOnError('2026-02-30')).toBe('startsOn');
  });

  it('tells a running, ending, ended, and coming subscription apart', () => {
    const running = subscription('a', '2026-10-01', '2026-12-31');
    const ending = subscription('a', '2026-10-01', '2026-10-20');
    const next = subscription('a', '2026-10-21', '2026-11-20');
    expect(subscriptionStatus(null, null, '2026-10-12')).toBe('none');
    expect(subscriptionStatus(running, null, '2026-10-12')).toBe('active');
    expect(subscriptionStatus(ending, null, '2026-10-12')).toBe('ending');
    expect(subscriptionStatus(ending, next, '2026-10-12')).toBe('active');
    expect(subscriptionStatus(ending, null, '2026-10-21')).toBe('ended');
    expect(subscriptionStatus(next, null, '2026-10-21')).toBe('active');
    expect(subscriptionStatus(null, next, '2026-10-12')).toBe('upcoming');
  });

  it('keeps the limit of an ended subscription, as the database does', () => {
    const [company] = companySubscriptions(
      [account('a', 'Alpha')],
      [subscription('a', '2026-08-01', '2026-08-31', 3)],
      [{ organizationId: 'a', activeVehicles: 2, today: '2026-10-12' }],
      '2026-01-01',
    );
    expect(company.status).toBe('ended');
    expect(company.vehicleLimit).toBe(3);
    expect(company.daysLeft).toBeNull();
  });

  it('lists the companies that need the operator first', () => {
    const companies = companySubscriptions(
      [account('a', 'Alpha'), account('b', 'Beta'), account('c', 'Gamma')],
      [
        subscription('a', '2026-10-01', '2026-12-31'),
        subscription('c', '2026-09-01', '2026-09-30'),
      ],
      [],
      '2026-10-12',
    );
    expect(
      companies.map((company) => [company.account.id, company.status]),
    ).toEqual([
      ['c', 'ended'],
      ['b', 'none'],
      ['a', 'active'],
    ]);
    expect(companies[2].daysLeft).toBe(81);
  });

  it('starts a renewal the day after the last subscription bought', () => {
    const [running, , ended] = companySubscriptions(
      [account('a', 'Alpha'), account('b', 'Beta'), account('c', 'Gamma')],
      [
        subscription('a', '2026-10-01', '2026-10-31'),
        subscription('a', '2026-11-01', '2026-11-30'),
        subscription('c', '2026-09-01', '2026-09-30'),
      ],
      [],
      '2026-10-12',
    ).sort((x, y) => x.account.id.localeCompare(y.account.id));
    expect(suggestedStart(running)).toBe('2026-12-01');
    expect(suggestedStart(ended)).toBe('2026-10-12');
  });
});
