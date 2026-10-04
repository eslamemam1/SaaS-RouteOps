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
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { CustomerAccessError } from '../application/customer-access-error';
import { CustomerRepository } from '../application/customer-repository';
import {
  Customer,
  CustomerDetails,
  CustomerOrganization,
  CustomerProblem,
  emptyCustomerDetails,
} from '../domain/customer';
import { customerDetailsSchema } from './customer-fields';
import { customersText } from './customers-text';

@Component({
  selector: 'app-customer-form',
  imports: [FormField],
  templateUrl: './customer-form.html',
})
export class CustomerForm {
  private readonly repository = inject(CustomerRepository);

  readonly organization = input.required<CustomerOrganization>();
  readonly customer = input<Customer | null>(null);
  readonly saved = output<Customer>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(customersText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly submitting = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);
  protected readonly problem = signal<CustomerProblem | null>(null);
  protected readonly model = signal<CustomerDetails>(emptyCustomerDetails);
  protected readonly customerForm = form(this.model, (field) => {
    apply(field, customerDetailsSchema(this.problems));
  });

  constructor() {
    effect(() => {
      const details = detailsOf(this.customer());
      untracked(() => {
        this.customerForm().reset(details);
        this.outcome.set(null);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.customerForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const existing = this.customer();
        const saved = existing
          ? await this.repository.update(
              this.organization(),
              existing.id,
              this.model(),
            )
          : await this.repository.add(this.organization(), this.model());
        this.customerForm().reset(emptyCustomerDetails);
        this.outcome.set(existing ? 'saved' : 'added');
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof CustomerAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

function detailsOf(customer: Customer | null): CustomerDetails {
  if (!customer) {
    return emptyCustomerDetails;
  }
  return {
    name: customer.name,
    contactName: customer.contactName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
    active: customer.active,
  };
}
