import { CompanyAccount } from './organization';
import {
  companyPayments,
  coversMonthError,
  currencyTotals,
  emptyPaymentDetails,
  paidOnError,
  paymentAmountError,
  paymentCompanyError,
  paymentNoteError,
  paymentsInMonth,
  shiftPaymentMonth,
  SubscriptionPayment,
} from './subscription-payment';

const nile: CompanyAccount = {
  id: 'org-nile',
  name: 'Nile Transport',
  currency: 'EGP',
  isActive: true,
  logins: [],
  createdAt: '2026-01-01T09:00:00Z',
  lastSignInAt: null,
};
const gulf: CompanyAccount = { ...nile, id: 'org-gulf', name: 'Gulf Transport', currency: 'SAR' };
const delta: CompanyAccount = { ...nile, id: 'org-delta', name: 'Delta Transport' };

function payment(
  id: string,
  organizationId: string,
  coversMonth: string,
  paidOn: string,
  amount: number,
): SubscriptionPayment {
  return { id, organizationId, coversMonth, paidOn, amount, note: '' };
}

const payments = [
  payment('p1', 'org-nile', '2026-09', '2026-09-02', 150_000),
  payment('p2', 'org-nile', '2026-10', '2026-10-01', 150_000),
  payment('p3', 'org-delta', '2026-10', '2026-10-05', 90_000),
  payment('p4', 'org-gulf', '2026-10', '2026-10-03', 40_000),
];

describe('subscription payments', () => {
  it('starts a new payment today, for this month, with no company chosen', () => {
    expect(emptyPaymentDetails('2026-10-11')).toEqual({
      organizationId: '',
      paidOn: '2026-10-11',
      coversMonth: '2026-10',
      amount: '',
      note: '',
    });
  });

  it('accepts only a company the operator provisioned', () => {
    expect(paymentCompanyError('org-nile', [nile, gulf])).toBeNull();
    expect(paymentCompanyError('', [nile, gulf])).toBe('company');
    expect(paymentCompanyError('org-unknown', [nile, gulf])).toBe('company');
  });

  it('needs a real payment date and a whole month', () => {
    expect(paidOnError('2026-10-03')).toBeNull();
    expect(paidOnError('2026-02-30')).toBe('paidOn');
    expect(paidOnError('')).toBe('paidOn');
    expect(coversMonthError('2026-10')).toBeNull();
    expect(coversMonthError('2026-13')).toBe('coversMonth');
    expect(coversMonthError('2026-10-01')).toBe('coversMonth');
  });

  it('needs an amount above zero in the chosen company currency', () => {
    expect(paymentAmountError('1500.50', 'EGP')).toBeNull();
    expect(paymentAmountError('١٥٠٠', 'EGP')).toBeNull();
    expect(paymentAmountError('0', 'EGP')).toBe('amount');
    expect(paymentAmountError('', 'EGP')).toBe('amount');
    expect(paymentAmountError('10.505', 'EGP')).toBe('amount');
    expect(paymentAmountError('10.505', 'KWD')).toBeNull();
    expect(paymentAmountError('abc', null)).toBeNull();
  });

  it('limits the note to 500 characters', () => {
    expect(paymentNoteError('Bank transfer 1234')).toBeNull();
    expect(paymentNoteError('x'.repeat(501))).toBe('noteLength');
  });

  it('lists the payments for a month, the latest paid first', () => {
    expect(paymentsInMonth(payments, '2026-10').map((item) => item.id)).toEqual([
      'p3',
      'p4',
      'p2',
    ]);
    expect(paymentsInMonth(payments, '2026-08')).toEqual([]);
  });

  it('never adds amounts of different currencies together', () => {
    expect(currencyTotals(paymentsInMonth(payments, '2026-10'), [nile, gulf, delta])).toEqual([
      { currency: 'EGP', total: 240_000 },
      { currency: 'SAR', total: 40_000 },
    ]);
  });

  it('sums what each company paid since the start, the latest payer first', () => {
    expect(companyPayments(payments, [nile, gulf, delta])).toEqual([
      {
        organizationId: 'org-delta',
        name: 'Delta Transport',
        currency: 'EGP',
        total: 90_000,
        count: 1,
        lastPaidOn: '2026-10-05',
        lastMonth: '2026-10',
      },
      {
        organizationId: 'org-gulf',
        name: 'Gulf Transport',
        currency: 'SAR',
        total: 40_000,
        count: 1,
        lastPaidOn: '2026-10-03',
        lastMonth: '2026-10',
      },
      {
        organizationId: 'org-nile',
        name: 'Nile Transport',
        currency: 'EGP',
        total: 300_000,
        count: 2,
        lastPaidOn: '2026-10-01',
        lastMonth: '2026-10',
      },
    ]);
  });

  it('leaves out a company that has not paid yet', () => {
    expect(companyPayments([], [nile])).toEqual([]);
  });

  it('moves between months across the year end', () => {
    expect(shiftPaymentMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftPaymentMonth('2026-01', -1)).toBe('2025-12');
  });
});
