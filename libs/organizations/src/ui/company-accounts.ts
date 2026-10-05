import { Component, computed, inject, signal } from '@angular/core';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { Alert, Button } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { CompanyAccount } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { organizationsText } from './organizations-text';

@Component({
  selector: 'app-company-accounts',
  imports: [Alert, Button],
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

  protected date(value: string): string {
    return this.dateFormat().format(new Date(value));
  }
}
