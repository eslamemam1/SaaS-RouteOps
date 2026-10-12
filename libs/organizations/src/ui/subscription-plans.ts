import { Component, computed, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { currencies } from '@routeops/shared/money';
import {
  formatPrice,
  periodPrice,
  planName,
  plansIn,
  SubscriptionMonths,
  subscriptionMonths,
  SubscriptionPeriod,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  paginate,
  Pager,
  Tag,
} from '@routeops/shared/ui';
import { discountPercent, SubscriptionProblem } from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { organizationsText } from './organizations-text';
import { PlanForm } from './plan-form';

type LongerMonths = Exclude<SubscriptionMonths, 1>;

const longerMonths = subscriptionMonths.filter(
  (months): months is LongerMonths => months !== 1,
);

@Component({
  selector: 'app-subscription-plans',
  imports: [
    Alert,
    Button,
    Field,
    FormDrawer,
    NgIcon,
    Pager,
    PlanForm,
    RouterLink,
    Tag,
  ],
  templateUrl: './subscription-plans.html',
})
export class SubscriptionPlans {
  private readonly repository = inject(SubscriptionRepository);
  private readonly language = inject(LanguageService).language;

  readonly changed = output<void>();

  protected readonly text = injectText(organizationsText);
  protected readonly addIcon = lucidePlus;
  protected readonly months = subscriptionMonths;
  protected readonly longerMonths = longerMonths;

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly plans = signal<SubscriptionPlan[]>([]);
  protected readonly periods = signal<SubscriptionPeriod[]>([]);
  protected readonly discounts = signal<Record<LongerMonths, string>>({
    3: '',
    6: '',
    12: '',
  });
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<SubscriptionPlan | null>(null);
  protected readonly outcome = signal<
    'added' | 'saved' | 'discountsSaved' | null
  >(null);
  protected readonly problem = signal<SubscriptionProblem | null>(null);
  protected readonly savingDiscounts = signal(false);

  protected readonly sortedPlans = computed(() =>
    currencies.flatMap((currency) => plansIn(this.plans(), currency)),
  );
  protected readonly planPages = paginate(this.sortedPlans);
  protected readonly invalidDiscounts = computed(() =>
    longerMonths.filter(
      (months) => discountPercent(this.discounts()[months]) === undefined,
    ),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.status.set('loading');
    this.problem.set(null);
    try {
      const [plans, periods] = await Promise.all([
        this.repository.listPlans(),
        this.repository.listPeriods(),
      ]);
      this.plans.set(plans);
      this.showPeriods(periods);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  protected add(): void {
    this.outcome.set(null);
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected edit(plan: SubscriptionPlan): void {
    this.outcome.set(null);
    this.editing.set(plan);
    this.formOpen.set(true);
  }

  protected saved(plan: SubscriptionPlan): void {
    const added = !this.plans().some((item) => item.id === plan.id);
    this.plans.update((plans) =>
      added
        ? [...plans, plan]
        : plans.map((item) => (item.id === plan.id ? plan : item)),
    );
    this.formOpen.set(false);
    this.outcome.set(added ? 'added' : 'saved');
    this.changed.emit();
  }

  protected setDiscount(months: LongerMonths, value: string): void {
    this.discounts.update((discounts) => ({ ...discounts, [months]: value }));
  }

  protected async saveDiscounts(event: Event): Promise<void> {
    event.preventDefault();
    this.outcome.set(null);
    this.problem.set(null);
    const discounts = this.discounts();
    const periods: SubscriptionPeriod[] = [];
    for (const months of longerMonths) {
      const percent = discountPercent(discounts[months]);
      if (percent === undefined) {
        this.problem.set('discount');
        return;
      }
      periods.push({ months, discountPercent: percent });
    }
    this.savingDiscounts.set(true);
    try {
      this.showPeriods(await this.repository.saveDiscounts(periods));
      this.outcome.set('discountsSaved');
      this.changed.emit();
    } catch (error) {
      this.problem.set(
        error instanceof SubscriptionError ? error.problem : 'save',
      );
    } finally {
      this.savingDiscounts.set(false);
    }
  }

  protected name(plan: SubscriptionPlan): string {
    return planName(plan, this.language());
  }

  protected periodAmount(
    plan: SubscriptionPlan,
    months: SubscriptionMonths,
  ): string | null {
    const period = this.periods().find((item) => item.months === months);
    return plan.monthlyPrice === null || !period
      ? null
      : formatPrice(
          periodPrice(plan.monthlyPrice, period),
          plan.currency,
          this.language(),
        );
  }

  private showPeriods(periods: SubscriptionPeriod[]): void {
    const discountOf = (months: LongerMonths) =>
      String(
        periods.find((item) => item.months === months)?.discountPercent ?? 0,
      );
    this.periods.set(periods);
    this.discounts.set({
      3: discountOf(3),
      6: discountOf(6),
      12: discountOf(12),
    });
  }
}
