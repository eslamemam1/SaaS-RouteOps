import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideArrowLeft, lucidePencil, lucidePhone } from '@ng-icons/lucide';
import {
  formatDay,
  formatMonth,
  formatWeekdayAndDay,
  injectText,
  LanguageService,
} from '@routeops/shared/i18n';
import { formatMoney, toMinorUnits } from '@routeops/shared/money';
import { payBreakdown, remainingPay } from '@routeops/shared/pay';
import {
  Alert,
  Avatar,
  Button,
  Field,
  FormDrawer,
  PageState,
  paginate,
  Pager,
  Tag,
  type Tone,
} from '@routeops/shared/ui';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository, DriverWork } from '../application/driver-repository';
import {
  Driver,
  DriverOrganization,
  DriverProblem,
  licenseExpired,
} from '../domain/driver';
import {
  choiceLabel,
  DriverMonth,
  DriverTrip,
  driverTotals,
  DriverTripState,
  driverTripState,
  isMonth,
  monthOf,
  shiftMonth,
  WorkChoice,
} from '../domain/driver-month';
import { DriverForm, DriverSaved } from './driver-form';
import { driversText } from './drivers-text';

const noWork: DriverWork = {
  choices: { customers: [], routes: [], vehicles: [], drivers: [] },
  routes: [],
};
const noMonth: DriverMonth = { trips: [], pay: null, unopenedDays: [] };

const stateTones: Record<DriverTripState, Tone> = {
  done: 'success',
  unrecorded: 'warning',
  planned: 'info',
  cancelled: 'neutral',
  absent: 'danger',
  handedOver: 'neutral',
};

@Component({
  selector: 'app-driver-page',
  imports: [
    Alert,
    Avatar,
    Button,
    DriverForm,
    Field,
    FormDrawer,
    NgIcon,
    PageState,
    Pager,
    RouterLink,
    Tag,
  ],
  templateUrl: './driver-page.html',
  styleUrl: './driver-page.css',
})
export class DriverPage {
  private readonly repository = inject(DriverRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(driversText);
  protected readonly icons = {
    back: lucideArrowLeft,
    edit: lucidePencil,
    phone: lucidePhone,
  };
  protected readonly today = localDate(new Date());
  protected readonly thisMonth = monthOf(this.today);
  protected readonly month = signal(this.thisMonth);
  protected readonly status = signal<
    'loading' | 'success' | 'missing' | 'error'
  >('loading');
  protected readonly problem = signal<DriverProblem>('load');
  protected readonly monthStatus = signal<'loading' | 'success' | 'error'>(
    'loading',
  );
  protected readonly organization = signal<DriverOrganization | null>(null);
  protected readonly driver = signal<Driver | null>(null);
  protected readonly work = signal<DriverWork>(noWork);
  protected readonly data = signal<DriverMonth>(noMonth);
  protected readonly pages = paginate(() => this.data().trips, { resetOn: this.month });
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'saved' | 'photoFailed' | null>(null);

  protected readonly monthLabel = computed(() =>
    formatMonth(this.month(), this.language()),
  );
  protected readonly totals = computed(() =>
    driverTotals(this.data().trips, this.driver()?.id ?? '', this.today),
  );
  protected readonly pay = computed(() => {
    const pay = this.data().pay;
    return pay
      ? {
          ...payBreakdown(pay),
          payType: pay.payType,
          recorded: pay.recorded,
          remaining: remainingPay(pay),
        }
      : null;
  });
  protected readonly expired = computed(() => {
    const driver = this.driver();
    return driver ? licenseExpired(driver.licenseExpiry, this.today) : false;
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => void this.load(params.get('driverId') ?? ''));
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

  // A typed amount of the driver's terms, written with its currency.
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

  protected stateOf(trip: DriverTrip): DriverTripState {
    return driverTripState(trip, this.driver()?.id ?? '');
  }

  protected toneOf(trip: DriverTrip): Tone {
    return stateTones[this.stateOf(trip)];
  }

  // The driver did not drive it and will not.
  protected isOff(trip: DriverTrip): boolean {
    const state = this.stateOf(trip);
    return (
      state === 'cancelled' || state === 'absent' || state === 'handedOver'
    );
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
    void this.load(this.route.snapshot.paramMap.get('driverId') ?? '');
  }

  protected retryMonth(): void {
    void this.loadMonth();
  }

  protected edit(): void {
    this.outcome.set(null);
    this.formOpen.set(true);
  }

  // Pay terms apply by month, so the month's pay is read again.
  protected onSaved({ driver, photoSaved }: DriverSaved): void {
    this.driver.set(driver);
    this.outcome.set(photoSaved ? 'saved' : 'photoFailed');
    this.formOpen.set(false);
    void this.loadMonth();
  }

  private async load(driverId: string): Promise<void> {
    this.status.set('loading');
    this.formOpen.set(false);
    this.outcome.set(null);
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
      const [driver, work] = await Promise.all([
        this.repository.driver(organization, driverId),
        this.repository.work(organization, driverId),
      ]);
      if (!driver) {
        this.status.set('missing');
        return;
      }
      this.driver.set(driver);
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
        error instanceof DriverAccessError ? error.problem : 'load',
      );
      this.status.set('error');
    }
  }

  private async loadMonth(): Promise<void> {
    const organization = this.organization();
    const driver = this.driver();
    if (!organization || !driver) {
      return;
    }
    const month = this.month();
    this.monthStatus.set('loading');
    try {
      const data = await this.repository.month(
        organization,
        driver.id,
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
