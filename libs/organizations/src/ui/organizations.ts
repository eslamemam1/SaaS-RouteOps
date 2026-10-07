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
  lucideWallet,
} from '@ng-icons/lucide';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import { Alert, Button, PageHeader, PageState, Tag } from '@routeops/shared/ui';
import { CompanyAccountProblem } from '../domain/company-account';
import { Dashboard, needsAttention } from '../domain/dashboard';
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
  { path: 'expenses', hint: 'expensesHint', icon: lucideWallet },
  { path: 'reports', hint: 'reportsHint', icon: lucideChartColumn },
] as const;

const attentionItems = [
  { key: 'unopenedDays', hint: 'unopenedDaysHint', path: 'operations' },
  { key: 'driverPay', hint: 'driverPayHint', path: 'expenses' },
  { key: 'vehiclePay', hint: 'vehiclePayHint', path: 'expenses' },
  { key: 'unpriced', hint: 'unpricedHint', path: 'routes' },
] as const;

@Component({
  selector: 'app-organizations',
  imports: [
    Alert,
    Button,
    CompanyAccounts,
    NgIcon,
    PageHeader,
    PageState,
    ProvisionCompanyForm,
    RouterLink,
    Tag,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class Organizations {
  private readonly repository = inject(OrganizationRepository);
  private readonly language = inject(LanguageService).language;
  private readonly today = localDate(new Date());
  protected readonly text = injectText(organizationsText);
  protected readonly sections = sections;
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<CompanyAccountProblem>('load');
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly active = signal<Organization | null>(null);
  protected readonly operator = signal(false);
  protected readonly summary = signal<Dashboard | null>(null);
  protected readonly summaryStatus = signal<'loading' | 'success' | 'error'>('loading');
  protected readonly attention = computed(() => {
    const summary = this.summary();
    return summary
      ? attentionItems
          .map((item) => ({ ...item, count: summary.attention[item.key] }))
          .filter((item) => item.count > 0)
      : [];
  });
  protected readonly allClear = computed(() => {
    const summary = this.summary();
    return summary !== null && !needsAttention(summary);
  });
  protected readonly todayLabel = computed(() =>
    dateFormat(this.language(), { weekday: 'long', day: 'numeric', month: 'long' }).format(
      noon(this.today),
    ),
  );
  protected readonly monthLabel = computed(() =>
    dateFormat(this.language(), { month: 'long', year: 'numeric' }).format(noon(this.today)),
  );
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
    void this.loadDashboard();
  }

  protected money(minor: number): string {
    const active = this.active();
    return active ? formatMoney(minor, active.currency, this.language()) : '';
  }

  protected async loadDashboard(): Promise<void> {
    const active = this.active();
    this.summary.set(null);
    if (!active?.isActive) {
      return;
    }
    this.summaryStatus.set('loading');
    try {
      const summary = await this.repository.dashboard(active.id, this.today);
      if (this.active()?.id === active.id) {
        this.summary.set(summary);
        this.summaryStatus.set('success');
      }
    } catch {
      if (this.active()?.id === active.id) {
        this.summaryStatus.set('error');
      }
    }
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
      void this.loadDashboard();
    } catch (error) {
      this.problem.set(
        error instanceof OrganizationAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function noon(day: string): Date {
  return new Date(`${day}T12:00:00`);
}

// Latin digits in both languages, as the rest of the interface uses.
function dateFormat(
  language: 'ar' | 'en',
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', options);
}
