import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  PageHeader,
  PageState,
  Tag,
} from '@routeops/shared/ui';
import { ExpenseAccessError } from '../application/expense-access-error';
import { ExpenseRepository } from '../application/expense-repository';
import {
  categoryTotals,
  choiceLabel,
  defaultDay,
  DriverPay,
  emptyExpenseDetails,
  Expense,
  ExpenseChoices,
  ExpenseDetails,
  expenseDetails,
  ExpenseMonth,
  ExpenseOrganization,
  ExpenseProblem,
  expenseTotal,
  isExpenseMonth,
  monthOf,
  PayBreakdown,
  payBreakdown,
  PerDirection,
  remainingPay,
  salaryDetails,
  shiftMonth,
} from '../domain/expense';
import { ExpenseForm } from './expense-form';
import { expensesText } from './expenses-text';

const noChoices: ExpenseChoices = { vehicles: [], drivers: [] };
const noMonth: ExpenseMonth = { expenses: [], pay: [] };

@Component({
  selector: 'app-expenses',
  imports: [
    Alert,
    Button,
    ExpenseForm,
    Field,
    FormDrawer,
    NgIcon,
    PageHeader,
    PageState,
    RouterLink,
    Tag,
  ],
  templateUrl: './expenses.html',
})
export class Expenses {
  private readonly repository = inject(ExpenseRepository);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(expensesText);
  protected readonly addIcon = lucidePlus;
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = monthOf(this.today);
  protected readonly month = signal(this.thisMonth);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<ExpenseProblem>('load');
  protected readonly organization = signal<ExpenseOrganization | null>(null);
  protected readonly choices = signal<ExpenseChoices>(noChoices);
  protected readonly data = signal<ExpenseMonth>(noMonth);
  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly formDetails = signal<ExpenseDetails>(emptyExpenseDetails(''));
  protected readonly outcome = signal<'added' | 'saved' | 'removed' | null>(null);
  protected readonly formTitle = computed(() =>
    this.editingId() ? this.text().form.editTitle : this.text().form.addTitle,
  );
  protected readonly categories = computed(() =>
    categoryTotals(this.data().expenses),
  );
  protected readonly stats = computed(() => {
    const text = this.text().list;
    const { expenses, pay } = this.data();
    const unrecorded = pay.reduce((total, line) => total + remainingPay(line), 0);
    return [
      { label: text.total, value: this.money(expenseTotal(expenses)) },
      { label: text.count, value: String(expenses.length) },
      { label: text.unrecordedPay, value: this.money(unrecorded) },
    ];
  });

  constructor() {
    void this.load();
  }

  protected money(minor: number): string {
    const organization = this.organization();
    return organization
      ? formatMoney(minor, organization.currency, this.language())
      : '';
  }

  protected vehicleName(id: string): string {
    return choiceLabel(this.choices().vehicles, id);
  }

  protected driverName(id: string): string {
    return choiceLabel(this.choices().drivers, id);
  }

  protected breakdown(pay: DriverPay): PayBreakdown {
    return payBreakdown(pay);
  }

  protected remaining(pay: DriverPay): number {
    return remainingPay(pay);
  }

  protected trips(trips: PerDirection): string {
    const text = this.text().pay;
    return `${text.outbound} ${trips.outbound} · ${text.return} ${trips.return}`;
  }

  protected hasTrips(trips: PerDirection): boolean {
    return trips.outbound + trips.return > 0;
  }

  protected chooseMonth(value: string): void {
    if (isExpenseMonth(value)) {
      this.month.set(value);
      void this.loadMonth();
    }
  }

  protected moveMonth(months: number): void {
    this.chooseMonth(shiftMonth(this.month(), months));
  }

  protected add(): void {
    this.open(null, emptyExpenseDetails(defaultDay(this.month(), this.today)));
  }

  protected edit(expense: Expense): void {
    const organization = this.organization();
    if (organization) {
      this.open(expense.id, expenseDetails(expense, organization.currency));
    }
  }

  protected recordSalary(pay: DriverPay): void {
    const organization = this.organization();
    if (organization) {
      this.open(
        null,
        salaryDetails(
          pay,
          defaultDay(this.month(), this.today),
          organization.currency,
          this.payNote(pay),
        ),
      );
    }
  }

  protected onDrawer(open: boolean): void {
    if (!open) {
      this.close();
    }
  }

  protected close(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  protected onSaved(): void {
    this.finish(this.editingId() ? 'saved' : 'added');
  }

  protected onRemoved(): void {
    this.finish('removed');
  }

  // For example "Salary 2026-10: Salary 3,000.00 + Extra trips (Outbound 4 · Return 2) 300.00".
  private payNote(pay: DriverPay): string {
    const text = this.text().pay;
    const sum = this.breakdown(pay);
    const parts =
      pay.payType === 'salary'
        ? [`${text.salaryPart} ${this.money(sum.salary)}`]
        : [];
    if (this.hasTrips(sum.extra)) {
      const label = pay.payType === 'salary' ? text.extraPart : text.tripsPart;
      parts.push(`${label} (${this.trips(sum.extra)}) ${this.money(sum.extraAmount)}`);
    }
    const note = parts.join(' + ');
    const missed = this.hasTrips(sum.missed)
      ? ` − ${text.missedPart} (${this.trips(sum.missed)}) ${this.money(sum.deduction)}`
      : '';
    const title = pay.payType === 'salary' ? text.noteSalary : text.notePay;
    return `${title} ${this.month()}: ${note}${missed}`;
  }

  private finish(outcome: 'added' | 'saved' | 'removed'): void {
    this.close();
    this.outcome.set(outcome);
    void this.loadMonth();
  }

  private open(expenseId: string | null, details: ExpenseDetails): void {
    this.outcome.set(null);
    this.editingId.set(expenseId);
    this.formDetails.set(details);
    this.formOpen.set(true);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const requestedId =
        this.activatedRoute.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.choices.set(await this.repository.choices(organization));
      this.organization.set(organization);
      await this.loadMonth();
    } catch (error) {
      this.fail(error);
    }
  }

  private async loadMonth(): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    const month = this.month();
    this.status.set('loading');
    try {
      const data = await this.repository.month(organization, month, this.today);
      if (month !== this.month()) {
        return;
      }
      this.data.set(data);
      this.status.set(
        data.expenses.length === 0 && data.pay.length === 0 ? 'empty' : 'success',
      );
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
    this.problem.set(error instanceof ExpenseAccessError ? error.problem : 'load');
    this.status.set('error');
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
