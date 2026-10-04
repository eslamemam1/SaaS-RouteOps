import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { CustomerAccessError } from '../application/customer-access-error';
import { CustomerRepository } from '../application/customer-repository';
import {
  Customer,
  CustomerDetails,
  customerMessages,
  CustomerOrganization,
  emptyCustomerDetails,
} from '../domain/customer';
import { customerDetailsSchema } from './customer-fields';

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

  protected readonly submitting = signal(false);
  protected readonly message = signal('');
  protected readonly model = signal<CustomerDetails>(emptyCustomerDetails);
  protected readonly customerForm = form(this.model, (field) => {
    apply(field, customerDetailsSchema);
  });

  constructor() {
    effect(() => {
      const details = detailsOf(this.customer());
      untracked(() => {
        this.customerForm().reset(details);
        this.message.set('');
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.customerForm, async () => {
      this.submitting.set(true);
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
        this.message.set(
          existing ? 'تم تحديث بيانات العميل.' : 'تمت إضافة العميل.',
        );
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const text =
          error instanceof CustomerAccessError
            ? error.message
            : customerMessages.save;
        this.message.set(text);
        return [{ kind: 'server', message: text }];
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
