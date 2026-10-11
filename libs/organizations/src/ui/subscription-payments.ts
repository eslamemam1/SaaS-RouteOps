import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucideBanknote, lucideHash, lucidePlus } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import { Alert, Button, Field, FormDrawer, paginate, Pager } from '@routeops/shared/ui';
import { CompanyAccount } from '../domain/organization';
import {
  companyPayments,
  currencyTotals,
  emptyPaymentDetails,
  PaymentDetails,
  paymentsInMonth,
  shiftPaymentMonth,
  SubscriptionPayment,
  SubscriptionPaymentProblem,
} from '../domain/subscription-payment';
import { OrganizationRepository } from '../application/organization-repository';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { organizationsText } from './organizations-text';
import { PaymentForm } from './payment-form';

@Component({
  selector: 'app-subscription-payments',
  imports: [Alert, Button, Field, FormDrawer, NgIcon, Pager, PaymentForm],
  templateUrl: './subscription-payments.html',
})
export class SubscriptionPayments {
  private readonly repository = inject(OrganizationRepository);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(organizationsText);
  protected readonly addIcon = lucidePlus;
  protected readonly statIcons = { total: lucideBanknote, count: lucideHash };
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = this.today.slice(0, 7);

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly accounts = signal<CompanyAccount[]>([]);
  protected readonly payments = signal<SubscriptionPayment[]>([]);
  protected readonly month = signal(this.thisMonth);
  protected readonly formOpen = signal(false);
  protected readonly formDetails = signal<PaymentDetails>(
    emptyPaymentDetails(this.today),
  );
  protected readonly outcome = signal<'recorded' | 'removed' | null>(null);
  protected readonly problem = signal<SubscriptionPaymentProblem | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected readonly removing = signal<string | null>(null);

  protected readonly monthPayments = computed(() =>
    paymentsInMonth(this.payments(), this.month()),
  );
  protected readonly monthTotals = computed(() =>
    currencyTotals(this.monthPayments(), this.accounts()),
  );
  protected readonly companies = computed(() =>
    companyPayments(this.payments(), this.accounts()),
  );
  protected readonly paymentPages = paginate(this.monthPayments, { resetOn: this.month });
  protected readonly companyPages = paginate(this.companies);
  private readonly accountsById = computed(
    () => new Map(this.accounts().map((account) => [account.id, account])),
  );
  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }),
  );
  private readonly monthFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.status.set('loading');
    this.problem.set(null);
    try {
      const [accounts, payments] = await Promise.all([
        this.repository.listCompanyAccounts(),
        this.repository.listSubscriptionPayments(),
      ]);
      this.accounts.set(accounts);
      this.payments.set(payments);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  protected moveMonth(months: number): void {
    this.month.update((month) => shiftPaymentMonth(month, months));
  }

  protected chooseMonth(month: string): void {
    if (/^\d{4}-\d{2}$/.test(month)) {
      this.month.set(month);
    }
  }

  protected add(): void {
    this.outcome.set(null);
    this.problem.set(null);
    this.formDetails.set({
      ...emptyPaymentDetails(this.today),
      coversMonth: this.month(),
    });
    this.formOpen.set(true);
  }

  protected recorded(payment: SubscriptionPayment): void {
    this.payments.update((payments) => [payment, ...payments]);
    this.formOpen.set(false);
    this.month.set(payment.coversMonth);
    this.outcome.set('recorded');
  }

  protected async remove(payment: SubscriptionPayment): Promise<void> {
    if (this.confirming() !== payment.id) {
      this.confirming.set(payment.id);
      return;
    }
    this.removing.set(payment.id);
    this.outcome.set(null);
    this.problem.set(null);
    try {
      await this.repository.removeSubscriptionPayment(payment.id);
      this.payments.update((payments) =>
        payments.filter((item) => item.id !== payment.id),
      );
      this.outcome.set('removed');
    } catch (error) {
      this.problem.set(
        error instanceof SubscriptionPaymentError ? error.problem : 'remove',
      );
    } finally {
      this.removing.set(null);
      this.confirming.set(null);
    }
  }

  protected companyName(organizationId: string): string {
    return this.accountsById().get(organizationId)?.name ?? '';
  }

  protected amount(organizationId: string, minor: number): string {
    const account = this.accountsById().get(organizationId);
    return account ? formatMoney(minor, account.currency, this.language()) : '';
  }

  protected money(total: { currency: CompanyAccount['currency']; total: number }): string {
    return formatMoney(total.total, total.currency, this.language());
  }

  protected date(value: string): string {
    return this.dateFormat().format(new Date(`${value}T00:00:00Z`));
  }

  protected monthName(month: string): string {
    return this.monthFormat().format(new Date(`${month}-01T00:00:00Z`));
  }

  private locale(): string {
    return this.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
