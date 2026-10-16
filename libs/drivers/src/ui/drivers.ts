import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideCalendarClock,
  lucideCreditCard,
  lucideIdCard,
  lucidePencil,
  lucidePhone,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import {
  Alert,
  Avatar,
  Button,
  FormDrawer,
  injectListView,
  PageHeader,
  PageState,
  Tag,
  Tone,
  paginate,
  Pager,
  ViewSwitch,
} from '@routeops/shared/ui';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository } from '../application/driver-repository';
import {
  Driver,
  DriverOrganization,
  DriverProblem,
  licenseExpired,
  licenseExpiresSoon,
  sortByName,
} from '../domain/driver';
import { DriverForm, DriverSaved } from './driver-form';
import { driversText } from './drivers-text';

@Component({
  selector: 'app-drivers',
  imports: [
    Alert,
    Avatar,
    Button,
    DriverForm,
    FormDrawer,
    NgIcon,
    PageHeader,
    PageState,
    RouterLink,
    Tag,
    Pager,
    ViewSwitch,
  ],
  templateUrl: './drivers.html',
})
export class Drivers {
  private readonly repository = inject(DriverRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly today = localDate(new Date());

  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(driversText);
  protected readonly addIcon = lucidePlus;
  protected readonly icons = {
    phone: lucidePhone,
    nationalId: lucideIdCard,
    license: lucideCreditCard,
    expiry: lucideCalendarClock,
    edit: lucidePencil,
    remove: lucideTrash2,
  };
  protected readonly view = injectListView('drivers');
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<DriverProblem>('load');
  protected readonly organization = signal<DriverOrganization | null>(null);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly pages = paginate(this.drivers);
  protected readonly editing = signal<Driver | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<
    'added' | 'saved' | 'removed' | 'photoFailed' | null
  >(null);
  protected readonly confirmingRemoveId = signal<string | null>(null);
  protected readonly actionProblem = signal<DriverProblem | null>(null);
  protected readonly blockingRoutes = signal<readonly string[]>([]);
  protected readonly removing = signal(false);
  protected readonly formTitle = computed(() =>
    this.editing() ? this.text().form.editTitle : this.text().form.addTitle,
  );

  constructor() {
    void this.load();
  }

  protected day(value: string): string {
    return formatDay(value, this.language());
  }

  protected retry(): void {
    void this.load();
  }

  protected licenseTone(driver: Driver): Tone | null {
    if (licenseExpired(driver.licenseExpiry, this.today)) {
      return 'danger';
    }
    return licenseExpiresSoon(driver.licenseExpiry, this.today)
      ? 'warning'
      : null;
  }

  protected add(): void {
    this.open(null);
  }

  protected edit(driver: Driver): void {
    this.open(driver);
  }

  protected onDrawer(open: boolean): void {
    if (!open) {
      this.stopEditing();
    }
  }

  protected stopEditing(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected onSaved({ driver, photoSaved }: DriverSaved): void {
    const others = this.drivers().filter((item) => item.id !== driver.id);
    this.drivers.set(sortByName([...others, driver]));
    this.outcome.set(
      !photoSaved ? 'photoFailed' : this.editing() ? 'saved' : 'added',
    );
    this.stopEditing();
    this.status.set('success');
  }

  protected async remove(driver: Driver): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    if (this.confirmingRemoveId() !== driver.id) {
      this.confirmingRemoveId.set(driver.id);
      return;
    }
    this.removing.set(true);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    try {
      await this.repository.remove(organization, driver);
      const drivers = this.drivers().filter((item) => item.id !== driver.id);
      this.drivers.set(drivers);
      if (this.editing()?.id === driver.id) {
        this.stopEditing();
      }
      this.outcome.set('removed');
      this.status.set(drivers.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.actionProblem.set(
        error instanceof DriverAccessError ? error.problem : 'remove',
      );
      this.blockingRoutes.set(
        error instanceof DriverAccessError ? error.routes : [],
      );
    } finally {
      this.removing.set(false);
      this.confirmingRemoveId.set(null);
    }
  }

  private open(driver: Driver | null): void {
    this.outcome.set(null);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    this.confirmingRemoveId.set(null);
    this.editing.set(driver);
    this.formOpen.set(true);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
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
      const drivers = await this.repository.list(organization);
      this.drivers.set(drivers);
      this.status.set(drivers.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof DriverAccessError ? error.problem : 'load',
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
