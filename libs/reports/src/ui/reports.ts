import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import { Alert, Button, Field, PageHeader, PageState, Tag } from '@routeops/shared/ui';
import { ReportsAccessError } from '../application/reports-access-error';
import { ReportsRepository } from '../application/reports-repository';
import {
  costShares,
  expenseSum,
  isReportMonth,
  MonthReport,
  monthOf,
  ReportChoices,
  ReportGroup,
  reportGroups,
  ReportLine,
  reportLines,
  ReportOrganization,
  ReportProblem,
  reportTotal,
  ReportVehicle,
  shiftMonth,
} from '../domain/trip-report';
import { reportsText } from './reports-text';

const noChoices: ReportChoices = { customers: [], routes: [], vehicles: [], drivers: [] };
const noReport: MonthReport = {
  counts: [],
  expenses: [],
  unopenedDays: [],
  unrecorded: { drivers: 0, vehicles: 0 },
};

@Component({
  selector: 'app-reports',
  imports: [Alert, Button, Field, PageHeader, PageState, RouterLink, Tag],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  private readonly repository = inject(ReportsRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(reportsText);
  private readonly language = inject(LanguageService).language;
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = monthOf(this.today);
  protected readonly month = signal(this.thisMonth);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<ReportProblem>('load');
  protected readonly organization = signal<ReportOrganization | null>(null);
  protected readonly choices = signal<ReportChoices>(noChoices);
  protected readonly report = signal<MonthReport>(noReport);
  protected readonly groups = reportGroups;
  protected readonly group = signal<ReportGroup>('customer');
  protected readonly total = computed(() => reportTotal(this.report().counts));
  protected readonly expenses = computed(() => expenseSum(this.report().expenses));
  protected readonly profit = computed(() => this.total().revenue - this.expenses());
  protected readonly lines = computed(() =>
    reportLines(
      this.report().counts,
      this.group(),
      this.choices(),
      this.report().expenses,
    ),
  );
  protected readonly otherCosts = computed(
    () => costShares(this.report().counts, this.report().expenses).other,
  );
  protected readonly unrecorded = computed(() => {
    const { drivers, vehicles } = this.report().unrecorded;
    return drivers + vehicles > 0 ? { drivers, vehicles } : null;
  });
  protected readonly unopenedTitle = computed(
    () => `${this.text().report.unopenedTitle} (${this.report().unopenedDays.length})`,
  );
  protected readonly unpricedTitle = computed(
    () => `${this.text().report.unpricedTitle} (${this.total().unpriced})`,
  );
  protected readonly stats = computed(() => {
    const text = this.text().report;
    const total = this.total();
    return [
      { label: text.revenueTotal, value: this.money(total.revenue) },
      { label: text.expensesTotal, value: this.money(this.expenses()) },
      { label: text.profitTotal, value: this.money(this.profit()) },
      { label: text.doneTotal, value: String(total.done) },
      { label: text.extraTotal, value: String(total.extra) },
    ];
  });

  constructor() {
    void this.load();
  }

  protected money(minor: number): string {
    const organization = this.organization();
    return organization
      ? formatMoney(minor, organization.currency, this.language())
      : '';
  }

  protected vehicleOf(line: ReportLine): ReportVehicle | undefined {
    return this.choices().vehicles.find((vehicle) => vehicle.id === line.id);
  }

  protected routeCustomer(line: ReportLine): string {
    const route = this.choices().routes.find((choice) => choice.id === line.id);
    return route
      ? (this.choices().customers.find((customer) => customer.id === route.customerId)?.label ?? '')
      : '';
  }

  protected companyShare(line: ReportLine): number {
    return line.revenue - line.driverCost - line.vehicleCost;
  }

  protected chooseMonth(value: string): void {
    if (isReportMonth(value)) {
      this.month.set(value);
      void this.loadMonth();
    }
  }

  protected moveMonth(months: number): void {
    this.chooseMonth(shiftMonth(this.month(), months));
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const requestedId =
        this.activatedRoute.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.choices.set(await this.repository.choices(organization));
      this.organization.set(organization);
      await this.loadMonth();
    } catch (error) {
      this.fail(error);
    }
  }

  private async loadMonth(): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    const month = this.month();
    this.status.set('loading');
    try {
      const report = await this.repository.month(organization, month, this.today);
      if (month !== this.month()) {
        return;
      }
      this.report.set(report);
      this.status.set(
        report.counts.length === 0 && report.expenses.length === 0
          ? 'empty'
          : 'success',
      );
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
    this.problem.set(error instanceof ReportsAccessError ? error.problem : 'load');
    this.status.set('error');
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
