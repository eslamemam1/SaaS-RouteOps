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
import { Alert, Button, Field } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { CompanyLogin } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { passwordField } from './account-fields';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-login-password',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './login-password.html',
})
export class LoginPassword {
  private readonly repository = inject(OrganizationRepository);

  readonly login = input.required<CompanyLogin>();
  readonly changed = output<CompanyLogin>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(organizationsText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly busy = signal(false);
  protected readonly problem = signal<CompanyAccountProblem | null>(null);
  protected readonly model = signal({ password: '' });
  protected readonly passwordForm = form(this.model, (field) => {
    apply(field.password, passwordField(this.problems));
  });

  constructor() {
    effect(() => {
      this.login();
      untracked(() => {
        this.passwordForm().reset({ password: '' });
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.passwordForm, async () => {
      this.busy.set(true);
      this.problem.set(null);
      try {
        await this.repository.setLoginPassword(
          this.login().id,
          this.model().password,
        );
        this.changed.emit(this.login());
        return undefined;
      } catch (error) {
        const problem =
          error instanceof OrganizationAccessError
            ? error.problem
            : 'passwordChange';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.busy.set(false);
      }
    });
  }
}
