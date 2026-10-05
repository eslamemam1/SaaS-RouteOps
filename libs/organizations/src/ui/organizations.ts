import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideBus,
  lucideCalendarDays,
  lucideChartColumn,
  lucideIdCard,
  lucideRoute,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Button, PageHeader, PageState } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { activeOrganization, Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { OrganizationRepository } from '../application/organization-repository';
import { CompanyAccounts } from './company-accounts';
import { organizationsText } from './organizations-text';
import { ProvisionCompanyForm } from './provision-company';

const sections = [
  { path: 'operations', hint: 'operationsHint', icon: lucideCalendarDays },
  { path: 'routes', hint: 'routesHint', icon: lucideRoute },
  { path: 'customers', hint: 'customersHint', icon: lucideBuilding2 },
  { path: 'vehicles', hint: 'vehiclesHint', icon: lucideBus },
  { path: 'drivers', hint: 'driversHint', icon: lucideIdCard },
  { path: 'reports', hint: 'reportsHint', icon: lucideChartColumn },
] as const;

@Component({
  selector: 'app-organizations',
  imports: [
    Button,
    CompanyAccounts,
    NgIcon,
    PageHeader,
    PageState,
    ProvisionCompanyForm,
    RouterLink,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class Organizations {
  private readonly repository = inject(OrganizationRepository);
  protected readonly text = injectText(organizationsText);
  protected readonly sections = sections;
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CompanyAccountProblem>('load');
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly active = signal<Organization | null>(null);
  protected readonly operator = signal(false);
  private readonly accounts = viewChild(CompanyAccounts);
  protected readonly headerTitle = computed(() => {
    const active = this.active();
    const home = this.text().home;
    return active ? `${home.welcome} ${active.name}` : home.title;
  });

  constructor() {
    void this.load();
  }

  protected choose(organizationId: string): void {
    this.active.set(activeOrganization(this.organizations(), organizationId));
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.load(), this.accounts()?.reload()]);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const organizations = await this.repository.listMine();
      this.organizations.set(organizations);
      this.operator.set(await this.repository.currentUserIsOperator());
      this.active.set(activeOrganization(organizations, null));
      this.status.set(organizations.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof OrganizationAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }
}
