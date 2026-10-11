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
import { Alert, Button, Field } from '@routeops/shared/ui';
import { CompanyAccount } from '../domain/organization';
import {
  coversMonthError,
  paidOnError,
  paymentAmountError,
  paymentCompanyError,
  PaymentDetails,
  paymentNoteError,
  SubscriptionPayment,
  SubscriptionPaymentProblem,
} from '../domain/subscription-payment';
import { OrganizationRepository } from '../application/organization-repository';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-payment-form',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './payment-form.html',
})
export class PaymentForm {
  private readonly repository = inject(OrganizationRepository);

  readonly accounts = input.required<readonly CompanyAccount[]>();
  readonly details = input.required<PaymentDetails>();
  readonly saved = output<SubscriptionPayment>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().payments.problems);

  protected readonly busy = signal(false);
  protected readonly problem = signal<SubscriptionPaymentProblem | null>(null);
  protected readonly model = signal<PaymentDetails>({
    organizationId: '',
    paidOn: '',
    coversMonth: '',
    amount: '',
    note: '',
  });
  protected readonly account = computed(
    () =>
      this.accounts().find(
        (account) => account.id === this.model().organizationId,
      ) ?? null,
  );
  protected readonly paymentForm = form(this.model, (path) => {
    validate(path.organizationId, ({ value }) =>
      this.fieldError(paymentCompanyError(value(), this.accounts())),
    );
    validate(path.paidOn, ({ value }) => this.fieldError(paidOnError(value())));
    validate(path.coversMonth, ({ value }) =>
      this.fieldError(coversMonthError(value())),
    );
    validate(path.amount, ({ value }) =>
      this.fieldError(
        paymentAmountError(value(), this.account()?.currency ?? null),
      ),
    );
    validate(path.note, ({ value }) =>
      this.fieldError(paymentNoteError(value())),
    );
  });

  constructor() {
    effect(() => {
      const details = this.details();
      untracked(() => {
        this.paymentForm().reset(details);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.paymentForm, async () => {
      const account = this.account();
      if (!account) {
        return [{ kind: 'company', message: this.problems().company }];
      }
      this.busy.set(true);
      this.problem.set(null);
      try {
        const payment = await this.repository.recordSubscriptionPayment(
          account,
          this.model(),
        );
        this.saved.emit(payment);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof SubscriptionPaymentError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.busy.set(false);
      }
    });
  }

  private fieldError(problem: SubscriptionPaymentProblem | null) {
    return problem === null
      ? undefined
      : { kind: problem, message: this.problems()[problem] };
  }
}
