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
import { form, FormField, submit, validate } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { currencies, toAmountText } from '@routeops/shared/money';
import { SubscriptionPlan } from '@routeops/shared/pricing';
import {
  Alert,
  Button,
  Field,
  Select,
  SelectOption,
} from '@routeops/shared/ui';
import {
  emptyPlanDetails,
  monthlyPriceError,
  planCurrencyError,
  PlanDetails,
  planNameError,
  SubscriptionProblem,
  vehicleLimitError,
} from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-plan-form',
  imports: [Alert, Button, Field, FormField, Select, SelectOption],
  templateUrl: './plan-form.html',
})
export class PlanForm {
  private readonly repository = inject(SubscriptionRepository);

  readonly plan = input<SubscriptionPlan | null>(null);
  readonly saved = output<SubscriptionPlan>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().subscriptionProblems);
  protected readonly currencies = currencies;

  protected readonly busy = signal(false);
  protected readonly problem = signal<SubscriptionProblem | null>(null);
  protected readonly model = signal<PlanDetails>(emptyPlanDetails);
  protected readonly planForm = form(this.model, (path) => {
    validate(path.nameAr, ({ value }) =>
      this.fieldError(planNameError(value())),
    );
    validate(path.nameEn, ({ value }) =>
      this.fieldError(planNameError(value())),
    );
    validate(path.currency, ({ value }) =>
      this.fieldError(planCurrencyError(value())),
    );
    validate(path.vehicleLimit, ({ value }) =>
      this.fieldError(vehicleLimitError(value())),
    );
    validate(path.monthlyPrice, ({ value }) =>
      this.fieldError(monthlyPriceError(value(), this.model().currency)),
    );
  });

  constructor() {
    effect(() => {
      const plan = this.plan();
      untracked(() => {
        this.planForm().reset(
          plan === null ? emptyPlanDetails : planDetails(plan),
        );
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.planForm, async () => {
      this.busy.set(true);
      this.problem.set(null);
      try {
        const plan = await this.repository.savePlan(
          this.plan()?.id ?? null,
          this.model(),
        );
        this.saved.emit(plan);
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

  private fieldError(problem: SubscriptionProblem | null) {
    return problem === null
      ? undefined
      : { kind: problem, message: this.problems()[problem] };
  }
}

function planDetails(plan: SubscriptionPlan): PlanDetails {
  return {
    nameAr: plan.nameAr,
    nameEn: plan.nameEn,
    currency: plan.currency,
    vehicleLimit: plan.vehicleLimit === null ? '' : String(plan.vehicleLimit),
    monthlyPrice: toAmountText(plan.monthlyPrice, plan.currency),
    isActive: plan.isActive,
  };
}
