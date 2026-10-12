import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { toAmountText } from '@routeops/shared/money';
import {
  formatPrice,
  offerName,
  planName,
  SubscriptionOffer,
  SubscriptionPeriod,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import {
  Alert,
  Button,
  FormDrawer,
  paginate,
  Pager,
  Tag,
  Tone,
} from '@routeops/shared/ui';
import { CompanyAccount } from '../domain/organization';
import {
  CompanySubscription,
  companySubscriptions,
  emptySubscriptionDetails,
  OrganizationSubscription,
  SubscriptionDetails,
  SubscriptionProblem,
  SubscriptionStatus,
  suggestedStart,
  VehicleUsage,
} from '../domain/subscription';
import { OrganizationRepository } from '../application/organization-repository';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { organizationsText } from './organizations-text';
import { SubscriptionForm } from './subscription-form';

const statusTones: Record<SubscriptionStatus, Tone> = {
  none: 'neutral',
  upcoming: 'info',
  active: 'success',
  ending: 'warning',
  ended: 'danger',
};

@Component({
  selector: 'app-company-subscriptions',
  imports: [Alert, Button, FormDrawer, NgIcon, Pager, SubscriptionForm, Tag],
  templateUrl: './company-subscriptions.html',
})
export class CompanySubscriptions {
  private readonly organizations = inject(OrganizationRepository);
  private readonly repository = inject(SubscriptionRepository);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(organizationsText);
  protected readonly addIcon = lucidePlus;
  protected readonly statusTones = statusTones;
  private readonly today = localDate(new Date());

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly accounts = signal<CompanyAccount[]>([]);
  protected readonly plans = signal<SubscriptionPlan[]>([]);
  protected readonly periods = signal<SubscriptionPeriod[]>([]);
  protected readonly offers = signal<SubscriptionOffer[]>([]);
  protected readonly subscriptions = signal<OrganizationSubscription[]>([]);
  protected readonly usage = signal<VehicleUsage[]>([]);
  protected readonly formOpen = signal(false);
  protected readonly formDetails = signal<SubscriptionDetails>(
    emptySubscriptionDetails(this.today),
  );
  protected readonly editing = signal<OrganizationSubscription | null>(null);
  protected readonly outcome = signal<
    'recorded' | 'updated' | 'removed' | null
  >(null);
  protected readonly problem = signal<SubscriptionProblem | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected readonly removing = signal<string | null>(null);

  protected readonly companies = computed(() =>
    companySubscriptions(
      this.accounts(),
      this.subscriptions(),
      this.usage(),
      this.today,
    ),
  );
  protected readonly companyPages = paginate(this.companies);
  protected readonly historyPages = paginate(this.subscriptions);
  private readonly accountsById = computed(
    () => new Map(this.accounts().map((account) => [account.id, account])),
  );
  private readonly plansById = computed(
    () => new Map(this.plans().map((plan) => [plan.id, plan])),
  );
  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(
        this.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
        {
          dateStyle: 'medium',
          timeZone: 'UTC',
        },
      ),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.status.set('loading');
    this.problem.set(null);
    try {
      const [accounts, plans, periods, offers, subscriptions, usage] =
        await Promise.all([
          this.organizations.listCompanyAccounts(),
          this.repository.listPlans(),
          this.repository.listPeriods(),
          this.repository.listOffers(),
          this.repository.listSubscriptions(),
          this.repository.vehicleUsage(),
        ]);
      this.accounts.set(accounts);
      this.plans.set(plans);
      this.periods.set(periods);
      this.offers.set(offers);
      this.subscriptions.set(subscriptions);
      this.usage.set(usage);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  protected add(company: CompanySubscription | null): void {
    this.outcome.set(null);
    this.problem.set(null);
    const last = company ? (company.next ?? company.current) : null;
    const plan = last ? this.plansById().get(last.planId) : undefined;
    this.editing.set(null);
    this.formDetails.set({
      ...emptySubscriptionDetails(company?.today ?? this.today),
      organizationId: company?.account.id ?? '',
      planId: plan?.isActive ? plan.id : '',
      months: String(last?.months ?? 1),
      startsOn: company ? suggestedStart(company) : this.today,
    });
    this.formOpen.set(true);
  }

  protected edit(subscription: OrganizationSubscription): void {
    const account = this.accountsById().get(subscription.organizationId);
    if (!account) {
      return;
    }
    this.outcome.set(null);
    this.problem.set(null);
    this.confirming.set(null);
    this.editing.set(subscription);
    this.formDetails.set({
      organizationId: subscription.organizationId,
      planId: subscription.planId,
      offerId: subscription.offerId ?? '',
      months: String(subscription.months ?? 1),
      startsOn: subscription.startsOn,
      vehicleLimit:
        subscription.vehicleLimit === null
          ? ''
          : String(subscription.vehicleLimit),
      price:
        subscription.trialDays === null
          ? toAmountText(subscription.price, account.currency)
          : '',
      note: subscription.note,
    });
    this.formOpen.set(true);
  }

  protected recorded(subscription: OrganizationSubscription): void {
    const corrected = this.editing() !== null;
    this.subscriptions.update((subscriptions) =>
      [
        subscription,
        ...subscriptions.filter((item) => item.id !== subscription.id),
      ].sort((a, b) => b.startsOn.localeCompare(a.startsOn)),
    );
    this.formOpen.set(false);
    this.editing.set(null);
    this.outcome.set(corrected ? 'updated' : 'recorded');
  }

  protected async remove(
    subscription: OrganizationSubscription,
  ): Promise<void> {
    if (this.confirming() !== subscription.id) {
      this.confirming.set(subscription.id);
      return;
    }
    this.removing.set(subscription.id);
    this.outcome.set(null);
    this.problem.set(null);
    try {
      await this.repository.removeSubscription(subscription.id);
      this.subscriptions.update((subscriptions) =>
        subscriptions.filter((item) => item.id !== subscription.id),
      );
      this.outcome.set('removed');
    } catch (error) {
      this.problem.set(
        error instanceof SubscriptionError ? error.problem : 'remove',
      );
    } finally {
      this.removing.set(null);
      this.confirming.set(null);
    }
  }

  protected companyName(organizationId: string): string {
    return this.accountsById().get(organizationId)?.name ?? '';
  }

  protected planOf(subscription: OrganizationSubscription): string {
    const plan = this.plansById().get(subscription.planId);
    return plan ? planName(plan, this.language()) : '';
  }

  // A trial shows its days in place of the period.
  protected periodOf(subscription: OrganizationSubscription): string {
    const text = this.text();
    return subscription.months === null
      ? `${text.subscriptions.trial} · ${text.subscriptions.trialDays} ${subscription.trialDays}`
      : text.plans.periods[subscription.months];
  }

  protected price(subscription: OrganizationSubscription): string {
    if (subscription.trialDays !== null) {
      return this.text().subscriptions.free;
    }
    const account = this.accountsById().get(subscription.organizationId);
    return account
      ? formatPrice(subscription.price, account.currency, this.language())
      : '';
  }

  protected offerOf(subscription: OrganizationSubscription): string {
    const offer = this.offers().find(
      (item) => item.id === subscription.offerId,
    );
    return offer ? offerName(offer, this.language()) : '';
  }

  // A company over its limit is red and one at it amber, so the operator sees
  // which company to offer a larger plan.
  protected usageTone(company: CompanySubscription): Tone | null {
    if (company.vehicleLimit === null) {
      return null;
    }
    if (company.activeVehicles > company.vehicleLimit) {
      return 'danger';
    }
    return company.activeVehicles === company.vehicleLimit ? 'warning' : null;
  }

  protected date(value: string): string {
    return this.dateFormat().format(new Date(`${value}T00:00:00Z`));
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
