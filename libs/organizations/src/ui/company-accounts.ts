import { Component, computed, inject, signal } from '@angular/core';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { Alert, Button, FormDrawer, paginate, Pager, Tag } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { CompanyAccount, CompanyLogin } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { LoginPassword } from './login-password';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-company-accounts',
  imports: [Alert, Button, FormDrawer, LoginPassword, Pager, Tag],
  templateUrl: './company-accounts.html',
})
export class CompanyAccounts {
  private readonly repository = inject(OrganizationRepository);
  private readonly language = inject(LanguageService).language;

  protected readonly text = injectText(organizationsText);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CompanyAccountProblem>('load');
  protected readonly accounts = signal<CompanyAccount[]>([]);
  protected readonly pages = paginate(this.accounts);
  protected readonly saving = signal<string | null>(null);
  protected readonly changed = signal<{ name: string; isActive: boolean } | null>(
    null,
  );
  protected readonly changeProblem = signal<CompanyAccountProblem | null>(null);
  protected readonly passwordLogin = signal<CompanyLogin | null>(null);
  protected readonly passwordChanged = signal<string | null>(null);
  private readonly dateFormat = computed(
    () =>
      new Intl.DateTimeFormat(
        this.language() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
        { dateStyle: 'medium' },
      ),
  );

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.status.set('loading');
    try {
      const accounts = await this.repository.listCompanyAccounts();
      this.accounts.set(accounts);
      this.status.set(accounts.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof OrganizationAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }

  protected async toggle(account: CompanyAccount): Promise<void> {
    const isActive = !account.isActive;
    this.saving.set(account.id);
    this.changed.set(null);
    this.changeProblem.set(null);
    try {
      await this.repository.setCompanyActive(account.id, isActive);
      this.accounts.update((accounts) =>
        accounts.map((item) =>
          item.id === account.id ? { ...item, isActive } : item,
        ),
      );
      this.changed.set({ name: account.name, isActive });
    } catch (error) {
      this.changeProblem.set(
        error instanceof OrganizationAccessError ? error.problem : 'accountStatus',
      );
    } finally {
      this.saving.set(null);
    }
  }

  protected changePassword(login: CompanyLogin): void {
    this.passwordChanged.set(null);
    this.passwordLogin.set(login);
  }

  protected onPasswordDrawer(open: boolean): void {
    if (!open) {
      this.passwordLogin.set(null);
    }
  }

  protected passwordSaved(login: CompanyLogin): void {
    this.passwordLogin.set(null);
    this.passwordChanged.set(login.email);
  }

  protected date(value: string): string {
    return this.dateFormat().format(new Date(value));
  }
}
