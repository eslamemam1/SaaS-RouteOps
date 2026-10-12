import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  disabled,
  form,
  FormField,
  submit,
  validate,
} from '@angular/forms/signals';
import { NgIcon } from '@ng-icons/core';
import { lucideCalendarCheck } from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { currencySymbol, toAmountText } from '@routeops/shared/money';
import {
  formatPrice,
  fullPrice,
  periodPrice,
  planFor,
  planName,
  plansIn,
  subscriptionEnd,
  SubscriptionPeriod,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import {
  Alert,
  Button,
  Field,
  Select,
  SelectOption,
} from '@routeops/shared/ui';
import {
  CompanySubscription,
  OrganizationSubscription,
  startsOnError,
  subscriptionCompanyError,
  SubscriptionDetails,
  subscriptionMonthsError,
  subscriptionNoteError,
  subscriptionPriceError,
  SubscriptionProblem,
  suggestedStart,
  vehicleLimitError,
} from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-subscription-form',
  imports: [Alert, Button, Field, FormField, NgIcon, Select, SelectOption],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css',
})
export class SubscriptionForm {
  private readonly repository = inject(SubscriptionRepository);
  private readonly language = inject(LanguageService).language;

  readonly companies = input.required<readonly CompanySubscription[]>();
  readonly plans = input.required<readonly SubscriptionPlan[]>();
  readonly periods = input.required<readonly SubscriptionPeriod[]>();
  readonly details = input.required<SubscriptionDetails>();
  // The subscription being corrected, or null for a new one.
  readonly subscriptionId = input<string | null>(null);
  readonly saved = output<OrganizationSubscription>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().subscriptionProblems);

  protected readonly endIcon = lucideCalendarCheck;
  protected readonly busy = signal(false);
  protected readonly problem = signal<SubscriptionProblem | null>(null);
  protected readonly model = signal<SubscriptionDetails>({
    organizationId: '',
    planId: '',
    months: '1',
    startsOn: '',
    vehicleLimit: '',
    price: '',
    note: '',
  });

  private readonly accounts = computed(() =>
    this.companies().map((company) => company.account),
  );
  protected readonly company = computed(
    () =>
      this.companies().find(
        (company) => company.account.id === this.model().organizationId,
      ) ?? null,
  );
  protected readonly currency = computed(
    () => this.company()?.account.currency ?? null,
  );
  protected readonly currencyLabel = computed(() => {
    const currency = this.currency();
    return currency === null ? '' : currencySymbol(currency, this.language());
  });
  protected readonly editing = computed(() => this.subscriptionId() !== null);
  protected readonly companyHint = computed(() => {
    const text = this.text().subscriptions;
    if (this.editing()) {
      return text.companyFixed;
    }
    const company = this.company();
    return company ? `${text.activeNow} ${company.activeVehicles}` : '';
  });
  // A subscription being corrected keeps its plan even if it is no longer on offer.
  protected readonly availablePlans = computed(() => {
    const currency = this.currency();
    const kept = this.editing() ? this.details().planId : null;
    return currency === null
      ? []
      : plansIn(
          this.plans().filter((plan) => plan.isActive || plan.id === kept),
          currency,
        );
  });
  protected readonly plan = computed(
    () =>
      this.availablePlans().find((plan) => plan.id === this.model().planId) ??
      null,
  );
  protected readonly period = computed(
    () =>
      this.periods().find(
        (period) => period.months === Number(this.model().months),
      ) ?? null,
  );
  protected readonly endsOn = computed(() => {
    const { startsOn } = this.model();
    const period = this.period();
    return period === null || startsOnError(startsOn) !== null
      ? null
      : subscriptionEnd(startsOn, period.months);
  });
  protected readonly breakdown = computed(() => {
    const plan = this.plan();
    const period = this.period();
    if (plan === null || plan.monthlyPrice === null || period === null) {
      return null;
    }
    const format = (minor: number) =>
      formatPrice(minor, plan.currency, this.language());
    return {
      monthly: format(plan.monthlyPrice),
      months: period.months,
      full: format(fullPrice(plan.monthlyPrice, period.months)),
      discount: period.discountPercent,
      total: format(periodPrice(plan.monthlyPrice, period)),
    };
  });

  protected readonly subscriptionForm = form(this.model, (path) => {
    disabled(path.organizationId, () => this.editing());
    validate(path.organizationId, ({ value }) =>
      this.fieldError(subscriptionCompanyError(value(), this.accounts())),
    );
    validate(path.planId, ({ value }) =>
      this.fieldError(
        this.availablePlans().some((plan) => plan.id === value())
          ? null
          : 'plan',
      ),
    );
    validate(path.months, ({ value }) =>
      this.fieldError(subscriptionMonthsError(value())),
    );
    validate(path.startsOn, ({ value }) =>
      this.fieldError(startsOnError(value())),
    );
    validate(path.vehicleLimit, ({ value }) =>
      this.fieldError(vehicleLimitError(value())),
    );
    validate(path.price, ({ value }) =>
      this.fieldError(subscriptionPriceError(value(), this.currency())),
    );
    validate(path.note, ({ value }) =>
      this.fieldError(subscriptionNoteError(value())),
    );
  });

  private chosenCompany = '';
  private keptPlan = '';
  private readonly companyChoice = computed(() => this.model().organizationId);
  private readonly planChoice = computed(
    () => `${this.model().planId}|${this.model().months}`,
  );

  constructor() {
    effect(() => {
      const details = this.details();
      untracked(() => {
        this.chosenCompany = details.organizationId;
        this.keptPlan = this.editing()
          ? `${details.planId}|${details.months}`
          : '';
        this.subscriptionForm().reset(details);
        this.problem.set(null);
      });
    });
    effect(() => {
      const organizationId = this.companyChoice();
      untracked(() => this.companyChanged(organizationId));
    });
    // A corrected subscription keeps its agreed limit and price until its plan or period changes.
    effect(() => {
      const choice = this.planChoice();
      untracked(() => {
        if (choice === this.keptPlan) {
          return;
        }
        this.keptPlan = '';
        this.fillFromPlan();
      });
    });
  }

  protected planLabel(plan: SubscriptionPlan): string {
    return planName(plan, this.language());
  }

  protected periodLabel(period: SubscriptionPeriod): string {
    const name = this.text().plans.periods[period.months];
    return period.discountPercent > 0
      ? `${name} (−${period.discountPercent}%)`
      : name;
  }

  protected date(value: string): string {
    return new Intl.DateTimeFormat(
      this.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
      {
        dateStyle: 'medium',
        timeZone: 'UTC',
      },
    ).format(new Date(`${value}T00:00:00Z`));
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.subscriptionForm, async () => {
      const company = this.company();
      if (!company) {
        return [{ kind: 'company', message: this.problems().company }];
      }
      this.busy.set(true);
      this.problem.set(null);
      try {
        const subscriptionId = this.subscriptionId();
        const subscription =
          subscriptionId === null
            ? await this.repository.recordSubscription(
                company.account,
                this.model(),
              )
            : await this.repository.updateSubscription(
                subscriptionId,
                company.account,
                this.model(),
              );
        this.saved.emit(subscription);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof SubscriptionError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.busy.set(false);
      }
    });
  }

  // A company the member picks gets the plan that takes its active vehicles
  // and a start right after its last subscription.
  private companyChanged(organizationId: string): void {
    if (organizationId === this.chosenCompany) {
      return;
    }
    this.chosenCompany = organizationId;
    const company = this.company();
    const plan = company
      ? planFor(this.availablePlans(), company.activeVehicles)
      : null;
    this.model.update((details) => ({
      ...details,
      planId: plan?.id ?? '',
      startsOn: company ? suggestedStart(company) : details.startsOn,
    }));
  }

  private fillFromPlan(): void {
    const plan = this.plan();
    const period = this.period();
    if (plan === null) {
      return;
    }
    this.model.update((details) => ({
      ...details,
      vehicleLimit: plan.vehicleLimit === null ? '' : String(plan.vehicleLimit),
      price:
        plan.monthlyPrice === null || period === null
          ? details.price
          : toAmountText(periodPrice(plan.monthlyPrice, period), plan.currency),
    }));
  }

  private fieldError(problem: SubscriptionProblem | null) {
    return problem === null
      ? undefined
      : { kind: problem, message: this.problems()[problem] };
  }
}
