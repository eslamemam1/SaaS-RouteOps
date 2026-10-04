import { Component, inject, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { companyAccountMessages } from '../domain/company-account';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { emailField, passwordField } from './account-fields';

@Component({
  selector: 'app-sign-in',
  imports: [FormField],
  templateUrl: './sign-in.html',
})
export class SignIn {
  private readonly repository = inject(OrganizationRepository);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly message = signal(
    this.repository.isConfigured() ? '' : companyAccountMessages.notConnected,
  );
  protected readonly model = signal({ email: '', password: '' });
  protected readonly signInForm = form(this.model, (field) => {
    apply(field.email, emailField);
    apply(field.password, passwordField);
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.signInForm, async () => {
      this.submitting.set(true);
      try {
        const value = this.model();
        await this.repository.signIn(value.email.trim(), value.password);
        await this.router.navigateByUrl('/');
        return undefined;
      } catch (error) {
        const text =
          error instanceof OrganizationAccessError
            ? error.message
            : companyAccountMessages.signIn;
        this.message.set(text);
        return [{ kind: 'server', message: text }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
