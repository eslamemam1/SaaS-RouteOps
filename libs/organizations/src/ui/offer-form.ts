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
import { NgIcon } from '@ng-icons/core';
import {
  lucideCalendarCheck,
  lucideEye,
  lucideGift,
  lucidePercent,
  lucideTicket,
} from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import { currencies } from '@routeops/shared/money';
import {
  formatPrice,
  OfferKind,
  offerKinds,
  planName,
  plansIn,
  SubscriptionMonths,
  subscriptionMonths,
  SubscriptionOffer,
  SubscriptionPlan,
} from '@routeops/shared/pricing';
import { Alert, Button, Field } from '@routeops/shared/ui';
import {
  emptyOfferDetails,
  offerCodeError,
  OfferDetails,
  offerDetails,
  offerEndsAfter,
  offerEndsOnError,
  OfferLength,
  offerLength,
  offerLengths,
  offerMonthsError,
  offerNameError,
  offerPercent,
  offerPlansError,
  trialDays,
} from '../domain/offer';
import { startsOnError, SubscriptionProblem } from '../domain/subscription';
import { SubscriptionError } from '../application/subscription-error';
import { SubscriptionRepository } from '../application/subscription-repository';
import { organizationsText } from './organizations-text';

// The chosen plans and periods are kept beside the form, which holds only
// the typed fields.
type OfferFields = Omit<OfferDetails, 'planIds' | 'months'>;

@Component({
  selector: 'app-offer-form',
  imports: [Alert, Button, Field, FormField, NgIcon],
  templateUrl: './offer-form.html',
  styleUrl: './offer-form.css',
})
export class OfferForm {
  private readonly repository = inject(SubscriptionRepository);
  private readonly language = inject(LanguageService).language;

  readonly offer = input<SubscriptionOffer | null>(null);
  readonly plans = input.required<readonly SubscriptionPlan[]>();
  readonly today = input.required<string>();
  readonly saved = output<SubscriptionOffer>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(organizationsText);
  protected readonly problems = computed(
    () => this.text().subscriptionProblems,
  );
  protected readonly kinds = offerKinds;
  protected readonly kindIcons: Record<OfferKind, string> = {
    percent: lucidePercent,
    trial: lucideGift,
  };
  protected readonly publicIcon = lucideEye;
  protected readonly codeIcon = lucideTicket;
  protected readonly endIcon = lucideCalendarCheck;
  protected readonly periods = subscriptionMonths;
  protected readonly lengths = offerLengths;

  protected readonly busy = signal(false);
  protected readonly tried = signal(false);
  protected readonly problem = signal<SubscriptionProblem | null>(null);
  protected readonly model = signal<OfferFields>(emptyOfferDetails(''));
  protected readonly planIds = signal<readonly string[]>([]);
  protected readonly months = signal<readonly SubscriptionMonths[]>([]);
  // A typed code is kept while the operator switches back and forth, and is
  // sent only when the offer is kept for companies that give it.
  protected readonly withCode = signal(false);
  protected readonly editing = computed(() => this.offer() !== null);
  protected readonly startsOnValid = computed(
    () => startsOnError(this.model().startsOn) === null,
  );
  protected readonly length = computed(() =>
    offerLength(this.model().startsOn, this.model().endsOn),
  );
  // Read only once the dates are valid, so a half-typed date says nothing.
  protected readonly lastDay = computed(() => {
    const { startsOn, endsOn } = this.model();
    if (
      endsOn === '' ||
      !this.startsOnValid() ||
      offerEndsOnError(startsOn, endsOn) !== null
    ) {
      return null;
    }
    return formatDay(endsOn, this.language());
  });

  // A plan no longer on offer stays choosable for an offer that names it.
  protected readonly choosablePlans = computed(() => {
    const kept = new Set(this.offer()?.planIds ?? []);
    const plans = this.plans().filter(
      (plan) => plan.isActive || kept.has(plan.id),
    );
    return currencies.flatMap((currency) => plansIn(plans, currency));
  });
  protected readonly plansError = computed(() =>
    this.tried() ? offerPlansError(this.planIds()) : null,
  );
  protected readonly monthsError = computed(() =>
    this.tried() ? offerMonthsError(this.model().kind, this.months()) : null,
  );

  protected readonly offerForm = form(this.model, (path) => {
    validate(path.nameAr, ({ value }) =>
      this.fieldError(offerNameError(value())),
    );
    validate(path.nameEn, ({ value }) =>
      this.fieldError(offerNameError(value())),
    );
    validate(path.percentOff, ({ value }) =>
      this.fieldError(
        this.model().kind === 'percent' && offerPercent(value()) === undefined
          ? 'percentOff'
          : null,
      ),
    );
    validate(path.trialDays, ({ value }) =>
      this.fieldError(
        this.model().kind === 'trial' && trialDays(value()) === undefined
          ? 'trialDays'
          : null,
      ),
    );
    validate(path.startsOn, ({ value }) =>
      this.fieldError(startsOnError(value())),
    );
    validate(path.endsOn, ({ value }) =>
      this.fieldError(offerEndsOnError(this.model().startsOn, value())),
    );
    validate(path.code, ({ value }) =>
      this.fieldError(this.withCode() ? offerCodeError(value(), true) : null),
    );
  });

  constructor() {
    effect(() => {
      const offer = this.offer();
      const today = this.today();
      untracked(() => {
        const { planIds, months, ...fields } =
          offer === null ? emptyOfferDetails(today) : offerDetails(offer);
        this.offerForm().reset(fields);
        this.planIds.set(planIds);
        this.months.set(months);
        this.withCode.set(fields.code !== '');
        this.tried.set(false);
        this.problem.set(null);
      });
    });
  }

  protected setKind(kind: OfferKind): void {
    this.model.update((fields) => ({ ...fields, kind }));
  }

  protected chooseLength(length: OfferLength): void {
    this.model.update((fields) => ({
      ...fields,
      endsOn: offerEndsAfter(fields.startsOn, length),
    }));
  }

  protected togglePlan(planId: string, checked: boolean): void {
    this.planIds.update((ids) =>
      checked ? [...ids, planId] : ids.filter((id) => id !== planId),
    );
  }

  protected toggleMonths(months: SubscriptionMonths, checked: boolean): void {
    this.months.update((chosen) =>
      checked
        ? subscriptionMonths.filter(
            (item) => item === months || chosen.includes(item),
          )
        : chosen.filter((item) => item !== months),
    );
  }

  protected planLabel(plan: SubscriptionPlan): string {
    return planName(plan, this.language());
  }

  protected planPrice(plan: SubscriptionPlan): string {
    return plan.monthlyPrice === null
      ? this.text().plans.agreed
      : `${formatPrice(plan.monthlyPrice, plan.currency, this.language())} ${this.text().offers.planMonthly}`;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.tried.set(true);
    const groups =
      offerPlansError(this.planIds()) ??
      offerMonthsError(this.model().kind, this.months());
    // The plans and periods show their own error, and an error returned here
    // would stay on the form after they are chosen.
    void submit(this.offerForm, async () => {
      if (groups !== null) {
        return undefined;
      }
      this.busy.set(true);
      this.problem.set(null);
      try {
        const offer = await this.repository.saveOffer(
          this.offer()?.id ?? null,
          {
            ...this.model(),
            code: this.withCode() ? this.model().code : '',
            planIds: this.planIds(),
            months: this.months(),
          },
        );
        this.saved.emit(offer);
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
