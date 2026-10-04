import { Component, inject, output, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { companyAccountMessages } from '../domain/company-account';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import {
  emailField,
  organizationNameField,
  passwordField,
} from './account-fields';

@Component({
  selector: 'app-provision-company',
  imports: [FormField],
  templateUrl: './provision-company.html',
})
export class ProvisionCompanyForm {
  private readonly repository = inject(OrganizationRepository);

  readonly created = output<void>();

  protected readonly submitting = signal(false);
  protected readonly message = signal('');
  protected readonly model = signal({
    organizationName: '',
    email: '',
    password: '',
  });
  protected readonly companyForm = form(this.model, (field) => {
    apply(field.organizationName, organizationNameField);
    apply(field.email, emailField);
    apply(field.password, passwordField);
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.companyForm, async () => {
      this.submitting.set(true);
      try {
        const value = this.model();
        await this.repository.provisionCompany({
          organizationName: value.organizationName,
          email: value.email,
          password: value.password,
        });
        this.model.set({ organizationName: '', email: '', password: '' });
        this.message.set(
          'تم إنشاء الشركة. أرسل البريد الإلكتروني وكلمة المرور للشركة.',
        );
        this.created.emit();
        return undefined;
      } catch (error) {
        const text =
          error instanceof OrganizationAccessError
            ? error.message
            : companyAccountMessages.create;
        this.message.set(text);
        return [{ kind: 'server', message: text }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
