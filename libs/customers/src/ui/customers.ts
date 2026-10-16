import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  FormDrawer,
  injectListView,
  PageHeader,
  PageState,
  Tag,
  paginate,
  Pager,
  ViewSwitch,
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
    Pager,
    ViewSwitch,
  ],
  templateUrl: './customers.html',
})
export class Customers {
  private readonly repository = inject(CustomerRepository);
  private readonly route = inject(ActivatedRoute);

  protected readonly text = injectText(customersText);
  protected readonly addIcon = lucidePlus;
  protected readonly customerIcon = lucideBuilding2;
  protected readonly icons = {
    edit: lucidePencil,
    remove: lucideTrash2,
  };
  protected readonly view = injectListView('customers');
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CustomerProblem>('load');
  protected readonly organization = signal<CustomerOrganization | null>(null);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly pages = paginate(this.customers);
  protected readonly editing = signal<Customer | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | 'removed' | null>(
    null,
  );
  protected readonly confirmingRemoveId = signal<string | null>(null);
  protected readonly actionProblem = signal<CustomerProblem | null>(null);
  protected readonly blockingRoutes = signal<readonly string[]>([]);
  protected readonly removing = signal(false);
  protected readonly formTitle = computed(() =>
    this.editing() ? this.text().form.editTitle : this.text().form.addTitle,
  );

  constructor() {
    void this.load();
  }

  protected retry(): void {
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

  protected async remove(customer: Customer): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    if (this.confirmingRemoveId() !== customer.id) {
      this.confirmingRemoveId.set(customer.id);
      return;
    }
    this.removing.set(true);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    try {
      await this.repository.remove(organization, customer);
      const customers = this.customers().filter((item) => item.id !== customer.id);
      this.customers.set(customers);
      if (this.editing()?.id === customer.id) {
        this.stopEditing();
      }
      this.outcome.set('removed');
      this.status.set(customers.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.actionProblem.set(
        error instanceof CustomerAccessError ? error.problem : 'remove',
      );
      this.blockingRoutes.set(
        error instanceof CustomerAccessError ? error.routes : [],
      );
    } finally {
      this.removing.set(false);
      this.confirmingRemoveId.set(null);
    }
  }

  private open(customer: Customer | null): void {
    this.outcome.set(null);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    this.confirmingRemoveId.set(null);
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
