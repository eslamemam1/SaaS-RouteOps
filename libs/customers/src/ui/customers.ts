import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  FormDrawer,
  PageHeader,
  PageState,
  Tag,
} from '@routeops/shared/ui';
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
  imports: [
    Alert,
    Button,
    CustomerForm,
    FormDrawer,
    NgIcon,
    PageHeader,
    PageState,
    Tag,
  ],
  templateUrl: './customers.html',
})
export class Customers {
  private readonly repository = inject(CustomerRepository);
  private readonly route = inject(ActivatedRoute);

  protected readonly text = injectText(customersText);
  protected readonly addIcon = lucidePlus;
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CustomerProblem>('load');
  protected readonly organization = signal<CustomerOrganization | null>(null);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly editing = signal<Customer | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);
  protected readonly formTitle = computed(() =>
    this.editing() ? this.text().form.editTitle : this.text().form.addTitle,
  );

  constructor() {
    void this.load();
  }

  protected add(): void {
    this.open(null);
  }

  protected edit(customer: Customer): void {
    this.open(customer);
  }

  protected onDrawer(open: boolean): void {
    if (!open) {
      this.stopEditing();
    }
  }

  protected stopEditing(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected onSaved(customer: Customer): void {
    const others = this.customers().filter((item) => item.id !== customer.id);
    this.customers.set(sortByName([...others, customer]));
    this.outcome.set(this.editing() ? 'saved' : 'added');
    this.stopEditing();
    this.status.set('success');
  }

  private open(customer: Customer | null): void {
    this.outcome.set(null);
    this.editing.set(customer);
    this.formOpen.set(true);
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
