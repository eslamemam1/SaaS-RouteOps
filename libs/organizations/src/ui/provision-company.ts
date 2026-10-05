import { Component, computed, inject, output, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { currencies, Currency, defaultCurrency } from '@routeops/shared/money';
import { Alert, Button, Field } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import {
  emailField,
  organizationNameField,
  passwordField,
} from './account-fields';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-provision-company',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './provision-company.html',
})
export class ProvisionCompanyForm {
  private readonly repository = inject(OrganizationRepository);

  readonly created = output<void>();

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly submitting = signal(false);
  protected readonly succeeded = signal(false);
  protected readonly problem = signal<CompanyAccountProblem | null>(null);
  protected readonly currencies = currencies;
  protected readonly model = signal<{
    organizationName: string;
    email: string;
    password: string;
    currency: Currency;
  }>({
    organizationName: '',
    email: '',
    password: '',
    currency: defaultCurrency,
  });
  protected readonly companyForm = form(this.model, (field) => {
    apply(field.organizationName, organizationNameField(this.problems));
    apply(field.email, emailField(this.problems));
    apply(field.password, passwordField(this.problems));
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.companyForm, async () => {
      this.submitting.set(true);
      this.succeeded.set(false);
      this.problem.set(null);
      try {
        const value = this.model();
        await this.repository.provisionCompany({
          organizationName: value.organizationName,
          email: value.email,
          password: value.password,
          currency: value.currency,
        });
        this.companyForm().reset({
          organizationName: '',
          email: '',
          password: '',
          currency: defaultCurrency,
        });
        this.succeeded.set(true);
        this.created.emit();
        return undefined;
      } catch (error) {
        const problem =
          error instanceof OrganizationAccessError ? error.problem : 'create';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
