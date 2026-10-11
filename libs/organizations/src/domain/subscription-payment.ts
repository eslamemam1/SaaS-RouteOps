import { Currency, toMinorUnits } from '@routeops/shared/money';
import { CompanyAccount } from './organization';

// A monthly subscription a company paid the site operator, recorded by hand
// once the money arrived. amount is in the smallest unit of the company's
// currency; coversMonth is the month it pays for, such as "2026-10".
export interface SubscriptionPayment {
  readonly id: string;
  readonly organizationId: string;
  readonly paidOn: string;
  readonly coversMonth: string;
  readonly amount: number;
  readonly note: string;
}

// What the form edits. amount is typed in the chosen company's currency.
export interface PaymentDetails {
  readonly organizationId: string;
  readonly paidOn: string;
  readonly coversMonth: string;
  readonly amount: string;
  readonly note: string;
}

export const subscriptionPaymentProblems = [
  'company',
  'paidOn',
  'coversMonth',
  'amount',
  'noteLength',
  'load',
  'save',
  'remove',
] as const;

export type SubscriptionPaymentProblem =
  (typeof subscriptionPaymentProblems)[number];

export const maximumPaymentNoteLength = 500;

export interface CurrencyTotal {
  readonly currency: Currency;
  readonly total: number;
}

export interface CompanyPayments {
  readonly organizationId: string;
  readonly name: string;
  readonly currency: Currency;
  readonly total: number;
  readonly count: number;
  readonly lastPaidOn: string;
  readonly lastMonth: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function emptyPaymentDetails(today: string): PaymentDetails {
  return {
    organizationId: '',
    paidOn: today,
    coversMonth: today.slice(0, 7),
    amount: '',
    note: '',
  };
}

export function paymentCompanyError(
  value: string,
  accounts: readonly CompanyAccount[],
): SubscriptionPaymentProblem | null {
  return accounts.some((account) => account.id === value) ? null : 'company';
}

export function paidOnError(value: string): SubscriptionPaymentProblem | null {
  if (!datePattern.test(value)) {
    return 'paidOn';
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    ? null
    : 'paidOn';
}

export function coversMonthError(
  value: string,
): SubscriptionPaymentProblem | null {
  return monthPattern.test(value) ? null : 'coversMonth';
}

// A payment always has an amount above zero. Before a company is chosen the
// amount cannot be read, so it is not judged yet.
export function paymentAmountError(
  value: string,
  currency: Currency | null,
): SubscriptionPaymentProblem | null {
  if (currency === null) {
    return null;
  }
  const minor = toMinorUnits(value, currency);
  return typeof minor === 'number' && minor > 0 ? null : 'amount';
}

export function paymentNoteError(
  value: string,
): SubscriptionPaymentProblem | null {
  return value.trim().length > maximumPaymentNoteLength ? 'noteLength' : null;
}

export function paymentsInMonth(
  payments: readonly SubscriptionPayment[],
  month: string,
): SubscriptionPayment[] {
  return payments
    .filter((payment) => payment.coversMonth === month)
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
}

// Companies work in different currencies, so totals are kept apart per
// currency and never added across them.
export function currencyTotals(
  payments: readonly SubscriptionPayment[],
  accounts: readonly CompanyAccount[],
): CurrencyTotal[] {
  const currencyOf = new Map(
    accounts.map((account) => [account.id, account.currency]),
  );
  const totals = new Map<Currency, number>();
  for (const payment of payments) {
    const currency = currencyOf.get(payment.organizationId);
    if (currency) {
      totals.set(currency, (totals.get(currency) ?? 0) + payment.amount);
    }
  }
  return [...totals]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

// Every company that has paid at least once, with all it has paid so far,
// the company that paid most recently first.
export function companyPayments(
  payments: readonly SubscriptionPayment[],
  accounts: readonly CompanyAccount[],
): CompanyPayments[] {
  const summaries: CompanyPayments[] = [];
  for (const account of accounts) {
    const own = payments.filter(
      (payment) => payment.organizationId === account.id,
    );
    if (own.length === 0) {
      continue;
    }
    summaries.push({
      organizationId: account.id,
      name: account.name,
      currency: account.currency,
      total: own.reduce((total, payment) => total + payment.amount, 0),
      count: own.length,
      lastPaidOn: own.reduce(
        (latest, payment) =>
          payment.paidOn > latest ? payment.paidOn : latest,
        own[0].paidOn,
      ),
      lastMonth: own.reduce(
        (latest, payment) =>
          payment.coversMonth > latest ? payment.coversMonth : latest,
        own[0].coversMonth,
      ),
    });
  }
  return summaries.sort(
    (a, b) =>
      b.lastPaidOn.localeCompare(a.lastPaidOn) || a.name.localeCompare(b.name),
  );
}

export function shiftPaymentMonth(month: string, months: number): string {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, index - 1 + months, 1));
  return date.toISOString().slice(0, 7);
}
