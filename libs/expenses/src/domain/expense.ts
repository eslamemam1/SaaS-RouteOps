import { Currency, toAmountText, toMinorUnits } from '@routeops/shared/money';

export interface ExpenseOrganization {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}

export const expenseCategories = [
  'fuel',
  'maintenance',
  'salaries',
  'rent',
  'contractors',
  'licenses',
  'tolls',
  'office',
  'other',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

// A vehicle or driver that an expense may name. Inactive ones stay listed,
// because past expenses may still name them.
export interface ExpenseChoice {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

export interface ExpenseChoices {
  readonly vehicles: readonly ExpenseChoice[];
  readonly drivers: readonly ExpenseChoice[];
}

// What the form edits. amount is typed in the organization currency; a blank
// vehicleId or driverId means the expense names none.
export interface ExpenseDetails {
  readonly spentOn: string;
  readonly category: string;
  readonly amount: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly description: string;
}

// amount is in the smallest unit of the organization currency.
export interface Expense {
  readonly id: string;
  readonly spentOn: string;
  readonly category: ExpenseCategory;
  readonly amount: number;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly description: string;
}

// How a driver is paid: 'salary' for an employee with a monthly salary, or
// 'perTrip' for a driver paid for each trip.
export const payTypes = ['salary', 'perTrip'] as const;

export type PayType = (typeof payTypes)[number];

export const tripDirections = ['outbound', 'return'] as const;

export type TripDirection = (typeof tripDirections)[number];

export type PerDirection = Readonly<Record<TripDirection, number>>;

// A driver's pay terms and trips for a month, and the salary already recorded
// for them as expenses. done counts the trips the driver did; absent counts
// trips of the driver's own routes cancelled or given to another driver
// because the driver was absent. A salary covers salaryTrips outbound and as
// many return trips; without salaryTrips it is fixed. Amounts are in the
// smallest currency unit.
export interface DriverPay {
  readonly driverId: string;
  readonly payType: PayType;
  readonly monthlySalary: number | null;
  readonly salaryTrips: number | null;
  readonly tripPay: PerDirection | null;
  readonly done: PerDirection;
  readonly absent: PerDirection;
  readonly recorded: number;
}

// How a suggested pay adds up. extra are the trips paid on top of the salary,
// or every trip of a driver paid per trip; missed are the trips taken off.
export interface PayBreakdown {
  readonly salary: number;
  readonly extra: PerDirection;
  readonly extraAmount: number;
  readonly missed: PerDirection;
  readonly deduction: number;
  readonly total: number;
}

export interface ExpenseMonth {
  readonly expenses: readonly Expense[];
  readonly pay: readonly DriverPay[];
}

export interface CategoryTotal {
  readonly category: ExpenseCategory;
  readonly total: number;
}

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

export const expenseLimits = {
  description: 500,
} as const;

export const expenseProblems = [
  'date',
  'category',
  'amount',
  'description',
  'tooLong',
  'load',
  'save',
  'remove',
  'organization',
  'signedOut',
  'notConnected',
] as const;

export type ExpenseProblem = (typeof expenseProblems)[number];

export function emptyExpenseDetails(spentOn: string): ExpenseDetails {
  return {
    spentOn,
    category: '',
    amount: '',
    vehicleId: '',
    driverId: '',
    description: '',
  };
}

export function expenseDetails(
  expense: Expense,
  currency: Currency,
): ExpenseDetails {
  return {
    spentOn: expense.spentOn,
    category: expense.category,
    amount: toAmountText(expense.amount, currency),
    vehicleId: expense.vehicleId,
    driverId: expense.driverId,
    description: expense.description,
  };
}

// A salary expense for what is left of a driver's suggested pay. description
// says how the pay adds up, so the record keeps it after the terms change.
export function salaryDetails(
  pay: DriverPay,
  spentOn: string,
  currency: Currency,
  description: string,
): ExpenseDetails {
  return {
    ...emptyExpenseDetails(spentOn),
    category: 'salaries',
    amount: toAmountText(remainingPay(pay), currency),
    driverId: pay.driverId,
    description: description.slice(0, expenseLimits.description),
  };
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (expenseCategories as readonly string[]).includes(value);
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function spentOnError(value: string): ExpenseProblem | null {
  if (!datePattern.test(value)) {
    return 'date';
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    ? null
    : 'date';
}

export function categoryError(value: string): ExpenseProblem | null {
  return isExpenseCategory(value) ? null : 'category';
}

// An expense always has an amount above zero.
export function expenseAmountError(
  value: string,
  currency: Currency,
): ExpenseProblem | null {
  const minor = toMinorUnits(value, currency);
  return typeof minor === 'number' && minor > 0 ? null : 'amount';
}

// "Other" says nothing by itself, so it needs a description.
export function descriptionError(
  value: string,
  category: string,
): ExpenseProblem | null {
  const description = value.trim();
  if (description.length > expenseLimits.description) {
    return 'tooLong';
  }
  return category === 'other' && description.length === 0
    ? 'description'
    : null;
}

export function isPayType(value: string): value is PayType {
  return (payTypes as readonly string[]).includes(value);
}

// Beyond the trips the salary covers, each done trip earns its direction's
// amount. Below them, only trips missed through absence are taken off, so a
// holiday or a breakdown costs the driver nothing, and absences first use up
// any trips beyond the salary.
export function payBreakdown(pay: DriverPay): PayBreakdown {
  const salary = pay.monthlySalary ?? 0;
  const rates = pay.tripPay ?? { outbound: 0, return: 0 };
  const covered = pay.payType === 'salary' ? pay.salaryTrips : 0;
  if (covered === null) {
    return {
      salary,
      extra: noTrips,
      extraAmount: 0,
      missed: noTrips,
      deduction: 0,
      total: salary,
    };
  }
  const extra = perDirection((direction) =>
    Math.max(0, pay.done[direction] - covered),
  );
  const missed = perDirection((direction) =>
    Math.min(Math.max(0, covered - pay.done[direction]), pay.absent[direction]),
  );
  const extraAmount = priced(extra, rates);
  const deduction = priced(missed, rates);
  return {
    salary,
    extra,
    extraAmount,
    missed,
    deduction,
    total: Math.max(0, salary + extraAmount - deduction),
  };
}

export function suggestedPay(pay: DriverPay): number {
  return payBreakdown(pay).total;
}

const noTrips: PerDirection = { outbound: 0, return: 0 };

function perDirection(count: (direction: TripDirection) => number): PerDirection {
  return { outbound: count('outbound'), return: count('return') };
}

function priced(trips: PerDirection, rates: PerDirection): number {
  return trips.outbound * rates.outbound + trips.return * rates.return;
}

export function remainingPay(pay: DriverPay): number {
  return Math.max(0, suggestedPay(pay) - pay.recorded);
}

export function expenseTotal(expenses: readonly Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function categoryTotals(expenses: readonly Expense[]): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    totals.set(
      expense.category,
      (totals.get(expense.category) ?? 0) + expense.amount,
    );
  }
  return [...totals]
    .map(([category, total]) => ({ category, total }))
    .sort((first, second) => second.total - first.total);
}

export function availableChoices(
  choices: readonly ExpenseChoice[],
  selectedId: string,
): ExpenseChoice[] {
  return choices.filter((choice) => choice.active || choice.id === selectedId);
}

export function choiceLabel(
  choices: readonly ExpenseChoice[],
  id: string,
): string {
  return choices.find((choice) => choice.id === id)?.label ?? '';
}

export function isExpenseMonth(value: string): boolean {
  return monthPattern.test(value);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, months: number): string {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, index - 1 + months, 1));
  return date.toISOString().slice(0, 7);
}

export function monthDays(month: string): DateRange {
  const [year, index] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, '0')}`,
  };
}

// The day a new expense of the month gets: today within the month, otherwise
// the month's closest day to today.
export function defaultDay(month: string, today: string): string {
  const { from, to } = monthDays(month);
  if (today < from) {
    return from;
  }
  return today > to ? to : today;
}

export function memberOrganization(
  memberships: readonly ExpenseOrganization[],
  requestedId: string,
): ExpenseOrganization | null {
  return (
    memberships.find((organization) => organization.id === requestedId) ?? null
  );
}
