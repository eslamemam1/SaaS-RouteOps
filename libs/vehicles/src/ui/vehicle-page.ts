import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBus,
  lucideCircleCheck,
  lucideCirclePlus,
  lucidePencil,
  lucideReceipt,
  lucideTrendingUp,
  lucideWallet,
} from '@ng-icons/lucide';
import {
  formatDay,
  formatMonth,
  formatTime,
  formatWeekdayAndDay,
  injectText,
  LanguageService,
} from '@routeops/shared/i18n';
import { formatMoney, toMinorUnits } from '@routeops/shared/money';
import { remainingRent, suggestedRent } from '@routeops/shared/pay';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  PageState,
  paginate,
  Pager,
  Tag,
  type Tone,
} from '@routeops/shared/ui';
import { VehicleAccessError } from '../application/vehicle-access-error';
import {
  VehicleRepository,
  VehicleWork,
} from '../application/vehicle-repository';
import {
  licenseExpired,
  Vehicle,
  VehicleOrganization,
  VehicleProblem,
} from '../domain/vehicle';
import {
  choiceLabel,
  expenseSum,
  isMonth,
  monthOf,
  shiftMonth,
  TripStatus,
  VehicleMonth,
  vehicleTotals,
  WorkChoice,
} from '../domain/vehicle-month';
import { VehicleForm } from './vehicle-form';
import { vehiclesText } from './vehicles-text';

const noWork: VehicleWork = {
  choices: { customers: [], routes: [], drivers: [] },
  routes: [],
};
const noMonth: VehicleMonth = {
  trips: [],
  rent: null,
  expenses: [],
  unopenedDays: [],
};

const statusTones: Record<TripStatus, Tone> = {
  done: 'success',
  unrecorded: 'warning',
  planned: 'info',
  cancelled: 'neutral',
};

@Component({
  selector: 'app-vehicle-page',
  imports: [
    Alert,
    Button,
    Field,
    FormDrawer,
    NgIcon,
    PageState,
    Pager,
    RouterLink,
    Tag,
    VehicleForm,
  ],
  templateUrl: './vehicle-page.html',
  styleUrl: './vehicle-page.css',
})
export class VehiclePage {
  private readonly repository = inject(VehicleRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(vehiclesText);
  protected readonly icons = {
    back: lucideArrowLeft,
    vehicle: lucideBus,
    edit: lucidePencil,
  };
  protected readonly statIcons = {
    done: lucideCircleCheck,
    extra: lucideCirclePlus,
    revenue: lucideTrendingUp,
    expenses: lucideReceipt,
    profit: lucideWallet,
  };
  protected readonly statusTones = statusTones;
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = monthOf(this.today);
  protected readonly month = signal(this.thisMonth);
  protected readonly status = signal<
    'loading' | 'success' | 'missing' | 'error'
  >('loading');
  protected readonly problem = signal<VehicleProblem>('load');
  protected readonly monthStatus = signal<'loading' | 'success' | 'error'>(
    'loading',
  );
  protected readonly organization = signal<VehicleOrganization | null>(null);
  protected readonly vehicle = signal<Vehicle | null>(null);
  protected readonly work = signal<VehicleWork>(noWork);
  protected readonly data = signal<VehicleMonth>(noMonth);
  protected readonly pages = paginate(() => this.data().trips, { resetOn: this.month });
  protected readonly formOpen = signal(false);
  protected readonly saved = signal(false);

  protected readonly monthLabel = computed(() =>
    formatMonth(this.month(), this.language()),
  );
  protected readonly totals = computed(() => vehicleTotals(this.data().trips));
  protected readonly expenses = computed(() =>
    expenseSum(this.data().expenses),
  );
  protected readonly profit = computed(
    () => this.totals().revenue - this.expenses(),
  );
  protected readonly rent = computed(() => {
    const rent = this.data().rent;
    return rent
      ? {
          ...rent,
          trips: rent.done.outbound + rent.done.return,
          suggested: suggestedRent(rent),
          remaining: remainingRent(rent),
        }
      : null;
  });
  protected readonly expired = computed(() => {
    const vehicle = this.vehicle();
    return vehicle ? licenseExpired(vehicle.licenseExpiry, this.today) : false;
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => void this.load(params.get('vehicleId') ?? ''));
  }

  protected time(value: string): string {
    return formatTime(value, this.language());
  }

  protected day(value: string): string {
    return formatDay(value, this.language());
  }

  protected tripDay(value: string): string {
    return formatWeekdayAndDay(value, this.language());
  }

  protected money(minor: number): string {
    const organization = this.organization();
    return organization
      ? formatMoney(minor, organization.currency, this.language())
      : '';
  }

  // A typed amount of the vehicle's rent terms, written with its currency.
  protected amount(text: string): string {
    const organization = this.organization();
    const minor = organization
      ? toMinorUnits(text, organization.currency)
      : null;
    return typeof minor === 'number' ? this.money(minor) : '';
  }

  protected label(choices: readonly WorkChoice[], id: string): string {
    return choiceLabel(choices, id);
  }

  protected chooseMonth(value: string): void {
    if (isMonth(value) && value !== this.month()) {
      this.month.set(value);
      void this.loadMonth();
    }
  }

  protected moveMonth(months: number): void {
    this.chooseMonth(shiftMonth(this.month(), months));
  }

  protected retry(): void {
    void this.load(this.route.snapshot.paramMap.get('vehicleId') ?? '');
  }

  protected retryMonth(): void {
    void this.loadMonth();
  }

  protected edit(): void {
    this.saved.set(false);
    this.formOpen.set(true);
  }

  // Rent terms apply by month, so the month's rent is read again.
  protected onSaved(vehicle: Vehicle): void {
    this.vehicle.set(vehicle);
    this.saved.set(true);
    this.formOpen.set(false);
    void this.loadMonth();
  }

  private async load(vehicleId: string): Promise<void> {
    this.status.set('loading');
    this.formOpen.set(false);
    this.saved.set(false);
    try {
      const requestedId =
        this.route.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.organization.set(organization);
      const [vehicle, work] = await Promise.all([
        this.repository.vehicle(organization, vehicleId),
        this.repository.work(organization, vehicleId),
      ]);
      if (!vehicle) {
        this.status.set('missing');
        return;
      }
      this.vehicle.set(vehicle);
      this.work.set(work);
      const requestedMonth =
        this.route.snapshot.queryParamMap.get('month') ?? '';
      if (isMonth(requestedMonth)) {
        this.month.set(requestedMonth);
      }
      this.status.set('success');
      await this.loadMonth();
    } catch (error) {
      this.problem.set(
        error instanceof VehicleAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }

  private async loadMonth(): Promise<void> {
    const organization = this.organization();
    const vehicle = this.vehicle();
    if (!organization || !vehicle) {
      return;
    }
    const month = this.month();
    this.monthStatus.set('loading');
    try {
      const data = await this.repository.month(
        organization,
        vehicle.id,
        month,
        this.today,
      );
      if (month !== this.month()) {
        return;
      }
      this.data.set(data);
      this.monthStatus.set('success');
    } catch {
      if (month === this.month()) {
        this.monthStatus.set('error');
      }
    }
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
