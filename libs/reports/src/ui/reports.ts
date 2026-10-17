import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideCirclePlus,
  lucideFileSpreadsheet,
  lucidePrinter,
  lucideReceipt,
  lucideTrendingUp,
  lucideWallet,
} from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import { formatMoney } from '@routeops/shared/money';
import {
  Alert,
  Button,
  DayPicker,
  Field,
  MonthPicker,
  PageHeader,
  PageState,
  paginate,
  Pager,
  Select,
  SelectOption,
  Tag,
  Tone,
} from '@routeops/shared/ui';
import { ReportsAccessError } from '../application/reports-access-error';
import { ReportsRepository } from '../application/reports-repository';
import {
  costShares,
  routeCompanyShare,
  vehicleLineProfit,
  customerInvoiceLines,
  expenseSum,
  invoiceDateError,
  invoiceDaysSoFar,
  InvoiceLine,
  isReportMonth,
  MonthReport,
  monthOf,
  previousMonthDays,
  ReportChoices,
  ReportGroup,
  reportGroups,
  ReportLine,
  reportLines,
  ReportOrganization,
  ReportProblem,
  reportTotal,
  ReportVehicle,
  TripCount,
  VehicleType,
} from '../domain/trip-report';
import {
  downloadTextFile,
  invoiceExcelCsv,
  invoiceExcelFileName,
  InvoiceExportLabels,
  invoicePrintHtml,
  openInvoicePdf,
} from './invoice-export';
import { reportsText } from './reports-text';

const noChoices: ReportChoices = {
  customers: [],
  routes: [],
  vehicles: [],
  drivers: [],
};
const noReport: MonthReport = {
  counts: [],
  expenses: [],
  unopenedDays: [],
  unrecorded: { drivers: 0, vehicles: 0 },
};

type ReportView = 'summary' | 'invoice';

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly tone: Tone;
  readonly icon: string;
}

@Component({
  selector: 'app-reports',
  imports: [
    Alert,
    Button,
    DayPicker,
    Field,
    MonthPicker,
    NgIcon,
    PageHeader,
    PageState,
    Pager,
    RouterLink,
    Select,
    SelectOption,
    Tag,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  private readonly repository = inject(ReportsRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(reportsText);
  private readonly language = inject(LanguageService).language;
  protected readonly icons = {
    excel: lucideFileSpreadsheet,
    pdf: lucidePrinter,
  };
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = monthOf(this.today);
  protected readonly month = signal(this.thisMonth);
  protected readonly view = signal<ReportView>('summary');
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<ReportProblem>('load');
  protected readonly organization = signal<ReportOrganization | null>(null);
  protected readonly choices = signal<ReportChoices>(noChoices);
  protected readonly report = signal<MonthReport>(noReport);
  protected readonly groups = reportGroups;
  protected readonly group = signal<ReportGroup>('customer');
  protected readonly customerId = signal('');
  protected readonly invoiceFrom = signal(invoiceDaysSoFar(this.today).from);
  protected readonly invoiceTo = signal(invoiceDaysSoFar(this.today).to);
  protected readonly invoiceStatus = signal<
    'idle' | 'loading' | 'success' | 'empty' | 'error'
  >('idle');
  protected readonly invoiceProblem = signal<ReportProblem | null>(null);
  protected readonly invoiceCounts = signal<readonly TripCount[]>([]);
  protected readonly invoiceUnopened = signal<readonly string[]>([]);
  protected readonly total = computed(() => reportTotal(this.report().counts));
  protected readonly expenses = computed(() =>
    expenseSum(this.report().expenses),
  );
  protected readonly profit = computed(
    () => this.total().revenue - this.expenses(),
  );
  protected readonly lines = computed(() =>
    reportLines(
      this.report().counts,
      this.group(),
      this.choices(),
      this.report().expenses,
    ),
  );
  protected readonly pages = paginate(this.lines, {
    resetOn: () => [this.month(), this.group()],
  });
  private readonly shares = computed(() =>
    costShares(this.report().counts, this.report().expenses),
  );
  protected readonly otherCosts = computed(() => this.shares().other);
  // Share-earning vehicles' shares less their own expenses, or null.
  protected readonly sharedVehicles = computed(
    () => this.shares().sharedVehicles,
  );
  protected readonly managementTotal = computed(
    () => this.total().management,
  );
  protected readonly hasSplit = computed(
    () => this.managementTotal() > 0 || this.sharedVehicles() !== null,
  );
  protected readonly unrecorded = computed(() => {
    const { drivers, vehicles } = this.report().unrecorded;
    return drivers + vehicles > 0 ? { drivers, vehicles } : null;
  });
  protected readonly unopenedTitle = computed(
    () =>
      `${this.text().report.unopenedTitle} (${this.report().unopenedDays.length})`,
  );
  protected readonly invoiceUnopenedTitle = computed(
    () =>
      `${this.text().report.unopenedTitle} (${this.invoiceUnopened().length})`,
  );
  protected readonly unpricedTitle = computed(
    () => `${this.text().report.unpricedTitle} (${this.total().unpriced})`,
  );
  protected readonly dateProblem = computed(() =>
    invoiceDateError(
      { from: this.invoiceFrom(), to: this.invoiceTo() },
      this.today,
    ),
  );
  protected readonly invoiceLines = computed(() =>
    customerInvoiceLines(
      this.invoiceCounts(),
      this.customerId(),
      this.choices(),
    ),
  );
  protected readonly invoicePages = paginate(this.invoiceLines, {
    resetOn: () => [
      this.customerId(),
      this.invoiceFrom(),
      this.invoiceTo(),
    ],
  });
  protected readonly invoiceTotal = computed(() =>
    this.invoiceLines().reduce((sum, line) => sum + line.revenue, 0),
  );
  protected readonly invoiceUnpriced = computed(() =>
    this.invoiceLines().reduce((sum, line) => sum + line.unpriced, 0),
  );
  protected readonly stats = computed(() => {
    const text = this.text().report;
    const total = this.total();
    const stats: Stat[] = [
      {
        label: text.revenueTotal,
        value: this.money(total.revenue),
        tone: 'success',
        icon: lucideTrendingUp,
      },
      {
        label: text.expensesTotal,
        value: this.money(this.expenses()),
        tone: 'warning',
        icon: lucideReceipt,
      },
      {
        label: text.profitTotal,
        value: this.money(this.profit()),
        tone: this.profit() < 0 ? 'danger' : 'info',
        icon: lucideWallet,
      },
      {
        label: text.doneTotal,
        value: String(total.full),
        tone: 'success',
        icon: lucideCircleCheck,
      },
      {
        label: text.extraTotal,
        value: String(total.extraFull),
        tone: 'info',
        icon: lucideCirclePlus,
      },
    ];
    return stats;
  });

  constructor() {
    void this.load();
  }

  protected day(value: string): string {
    return formatDay(value, this.language());
  }

  protected retry(): void {
    void (this.view() === 'invoice' ? this.loadInvoice() : this.load());
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
      ? (this.choices().customers.find(
          (customer) => customer.id === route.customerId,
        )?.label ?? '')
      : '';
  }

  protected companyShare(line: ReportLine): number {
    return routeCompanyShare(line);
  }

  protected vehicleProfit(line: ReportLine): number {
    return vehicleLineProfit(line);
  }

  protected routeLabel(line: InvoiceLine): string {
    return line.label || this.text().invoice.extras;
  }

  protected vehicleTypeLabel(type: VehicleType | ''): string {
    return type ? this.text().vehicleTypes[type] : this.text().invoice.noType;
  }

  protected chooseMonth(value: string): void {
    if (isReportMonth(value)) {
      this.month.set(value);
      void this.loadMonth();
    }
  }

  protected showView(view: ReportView): void {
    this.view.set(view);
    if (view === 'invoice') {
      void this.loadInvoice();
    }
  }

  protected chooseCustomer(value: string): void {
    this.customerId.set(value);
    void this.loadInvoice();
  }

  protected setInvoiceFrom(value: string): void {
    this.invoiceFrom.set(value);
    void this.loadInvoice();
  }

  protected setInvoiceTo(value: string): void {
    this.invoiceTo.set(value);
    void this.loadInvoice();
  }

  protected chooseInvoiceDays(kind: 'thisMonth' | 'lastMonth'): void {
    const days =
      kind === 'thisMonth'
        ? invoiceDaysSoFar(this.today)
        : previousMonthDays(this.today);
    this.invoiceFrom.set(days.from);
    this.invoiceTo.set(days.to);
    void this.loadInvoice();
  }

  protected downloadExcel(): void {
    const meta = this.exportMeta();
    if (!meta || this.invoiceLines().length === 0) {
      return;
    }
    const labels = this.exportLabels();
    const csv = invoiceExcelCsv(
      this.invoiceLines(),
      labels,
      meta,
      (line) => this.routeLabel(line),
      (line) => this.vehicleTypeLabel(line.vehicleType),
    );
    downloadTextFile(
      invoiceExcelFileName(meta),
      csv,
      'text/csv;charset=utf-8',
    );
  }

  protected downloadPdf(): void {
    const meta = this.exportMeta();
    if (!meta || this.invoiceLines().length === 0) {
      return;
    }
    openInvoicePdf(
      invoicePrintHtml(
        this.invoiceLines(),
        this.exportLabels(),
        meta,
        (line) => this.routeLabel(line),
        (line) => this.vehicleTypeLabel(line.vehicleType),
        (minor) => this.money(minor),
      ),
    );
  }

  private exportLabels(): InvoiceExportLabels {
    const invoice = this.text().invoice;
    return {
      title: invoice.title,
      customer: invoice.customer,
      from: invoice.from,
      to: invoice.to,
      serial: invoice.serial,
      route: invoice.route,
      vehicleType: invoice.vehicleType,
      trips: invoice.trips,
      rate: invoice.rate,
      lineTotal: invoice.lineTotal,
      grandTotal: invoice.grandTotal,
      noRate: invoice.noRate,
    };
  }

  private exportMeta() {
    const organization = this.organization();
    const customer = this.choices().customers.find(
      (choice) => choice.id === this.customerId(),
    );
    if (!organization || !customer) {
      return null;
    }
    return {
      customerName: customer.label,
      from: this.invoiceFrom(),
      to: this.invoiceTo(),
      fromLabel: this.day(this.invoiceFrom()),
      toLabel: this.day(this.invoiceTo()),
      currency: organization.currency,
      language: this.language(),
    };
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
      const choices = await this.repository.choices(organization);
      this.choices.set(choices);
      this.organization.set(organization);
      if (!this.customerId() && choices.customers[0]) {
        this.customerId.set(choices.customers[0].id);
      }
      const requestedMonth =
        this.activatedRoute.snapshot.queryParamMap.get('month') ?? '';
      if (isReportMonth(requestedMonth)) {
        this.month.set(requestedMonth);
      }
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
      const report = await this.repository.month(
        organization,
        month,
        this.today,
      );
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

  private async loadInvoice(): Promise<void> {
    const organization = this.organization();
    if (!organization || this.view() !== 'invoice') {
      return;
    }
    if (!this.customerId()) {
      this.invoiceCounts.set([]);
      this.invoiceUnopened.set([]);
      this.invoiceProblem.set(null);
      this.invoiceStatus.set('idle');
      return;
    }
    const days = { from: this.invoiceFrom(), to: this.invoiceTo() };
    const problem = invoiceDateError(days, this.today);
    if (problem) {
      this.invoiceCounts.set([]);
      this.invoiceUnopened.set([]);
      this.invoiceProblem.set(problem);
      this.invoiceStatus.set('error');
      return;
    }
    this.invoiceStatus.set('loading');
    this.invoiceProblem.set(null);
    try {
      const report = await this.repository.range(
        organization,
        days,
        this.today,
      );
      if (
        days.from !== this.invoiceFrom() ||
        days.to !== this.invoiceTo() ||
        this.view() !== 'invoice'
      ) {
        return;
      }
      this.invoiceCounts.set(report.counts);
      this.invoiceUnopened.set(report.unopenedDays);
      const lines = customerInvoiceLines(
        report.counts,
        this.customerId(),
        this.choices(),
      );
      this.invoiceStatus.set(lines.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.invoiceProblem.set(
        error instanceof ReportsAccessError ? error.problem : 'load',
      );
      this.invoiceStatus.set('error');
    }
  }

  private fail(error: unknown): void {
    this.problem.set(
      error instanceof ReportsAccessError ? error.problem : 'load',
    );
    this.status.set('error');
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
