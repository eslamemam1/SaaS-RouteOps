import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBus,
  lucideCheck,
  lucideTag,
} from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import {
  Currency,
  currencySymbol,
  defaultCurrency,
} from '@routeops/shared/money';
import {
  formatPrice,
  fullPrice,
  periodPrice,
  periodSaving,
  planCurrencies,
  planFor,
  planName,
  plansIn,
  SubscriptionMonths,
  SubscriptionPeriod,
} from '@routeops/shared/pricing';
import {
  Button,
  Field,
  PageState,
  PublicHero,
  PublicLayout,
  Select,
  SelectOption,
} from '@routeops/shared/ui';
import {
  PriceList,
  PricingRepository,
} from '../application/pricing-repository';
import { siteText } from './site-text';

@Component({
  selector: 'app-pricing',
  imports: [
    Button,
    Field,
    NgIcon,
    PageState,
    PublicHero,
    PublicLayout,
    RouterLink,
    Select,
    SelectOption,
  ],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
  private readonly repository = inject(PricingRepository);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(siteText);
  protected readonly icons = {
    eyebrow: lucideTag,
    check: lucideCheck,
    vehicles: lucideBus,
    arrow: lucideArrowRight,
  };
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly list = signal<PriceList>({ plans: [], periods: [] });
  protected readonly currency = signal<Currency>(defaultCurrency);
  protected readonly months = signal<SubscriptionMonths>(1);
  protected readonly vehicles = signal('');

  protected readonly periods = computed(() => this.list().periods);
  protected readonly currencies = computed(() =>
    planCurrencies(this.list().plans).map((currency) => ({
      value: currency,
      label: `${currency} · ${currencySymbol(currency, this.language())}`,
    })),
  );
  private readonly plans = computed(() =>
    plansIn(this.list().plans, this.currency()),
  );
  private readonly period = computed<SubscriptionPeriod>(
    () =>
      this.periods().find((period) => period.months === this.months()) ?? {
        months: this.months(),
        discountPercent: 0,
      },
  );
  private readonly fleet = computed(() => vehicleCount(this.vehicles()));
  protected readonly recommended = computed(() => {
    const fleet = this.fleet();
    return fleet === null ? null : (planFor(this.plans(), fleet)?.id ?? null);
  });
  protected readonly tooMany = computed(
    () =>
      this.fleet() !== null &&
      this.plans().length > 0 &&
      this.recommended() === null,
  );
  protected readonly cards = computed(() => {
    const period = this.period();
    return this.plans().map((plan) => ({
      id: plan.id,
      name: planName(plan, this.language()),
      vehicleLimit: plan.vehicleLimit,
      price:
        plan.monthlyPrice === null
          ? null
          : {
              total: this.money(periodPrice(plan.monthlyPrice, period)),
              full: this.money(fullPrice(plan.monthlyPrice, period.months)),
              saving: periodSaving(plan.monthlyPrice, period),
              savingText: this.money(periodSaving(plan.monthlyPrice, period)),
            },
    }));
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.status.set('loading');
    try {
      const list = await this.repository.load();
      this.list.set(list);
      const currencies = planCurrencies(list.plans);
      if (!currencies.includes(this.currency()) && currencies.length > 0) {
        this.currency.set(currencies[0]);
      }
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  protected chooseCurrency(value: string): void {
    const found = planCurrencies(this.list().plans).find(
      (currency) => currency === value,
    );
    if (found) {
      this.currency.set(found);
    }
  }

  private money(minor: number): string {
    return formatPrice(minor, this.currency(), this.language());
  }
}

// A typed count of vehicles in Latin or Arabic digits, or null when none is typed.
function vehicleCount(text: string): number | null {
  const digits = text
    .trim()
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    );
  if (!/^\d{1,5}$/.test(digits)) {
    return null;
  }
  const count = Number(digits);
  return count > 0 ? count : null;
}
