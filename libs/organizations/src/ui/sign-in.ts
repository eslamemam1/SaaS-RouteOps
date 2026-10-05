import { Component, computed, inject, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button, Field, LanguageSwitch } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { emailField, passwordField } from './account-fields';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-sign-in',
  imports: [Alert, Button, Field, FormField, LanguageSwitch],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private readonly repository = inject(OrganizationRepository);
  private readonly router = inject(Router);

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly submitting = signal(false);
  protected readonly problem = signal<CompanyAccountProblem | null>(
    this.repository.isConfigured() ? null : 'notConnected',
  );
  protected readonly model = signal({ email: '', password: '' });
  protected readonly signInForm = form(this.model, (field) => {
    apply(field.email, emailField(this.problems));
    apply(field.password, passwordField(this.problems));
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
        const problem =
          error instanceof OrganizationAccessError ? error.problem : 'signIn';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
