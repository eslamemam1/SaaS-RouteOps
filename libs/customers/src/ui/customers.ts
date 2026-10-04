import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { CustomerAccessError } from '../application/customer-access-error';
import { CustomerRepository } from '../application/customer-repository';
import {
  Customer,
  CustomerOrganization,
  CustomerProblem,
  sortByName,
} from '../domain/customer';
import { CustomerForm } from './customer-form';
import { customersText } from './customers-text';

@Component({
  selector: 'app-customers',
  imports: [CustomerForm, RouterLink],
  templateUrl: './customers.html',
})
export class Customers {
  private readonly repository = inject(CustomerRepository);
  private readonly route = inject(ActivatedRoute);

  protected readonly text = injectText(customersText);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CustomerProblem>('load');
  protected readonly organization = signal<CustomerOrganization | null>(null);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly editing = signal<Customer | null>(null);

  constructor() {
    void this.load();
  }

  protected edit(customer: Customer): void {
    this.editing.set(customer);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onSaved(customer: Customer): void {
    const others = this.customers().filter((item) => item.id !== customer.id);
    this.customers.set(sortByName([...others, customer]));
    this.editing.set(null);
    this.status.set('success');
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const requestedId =
        this.route.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.organization.set(organization);
      const customers = await this.repository.list(organization);
      this.customers.set(customers);
      this.status.set(customers.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof CustomerAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }
}
