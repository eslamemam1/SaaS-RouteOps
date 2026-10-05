import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  FormDrawer,
  PageHeader,
  PageState,
  Tag,
} from '@routeops/shared/ui';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository } from '../application/driver-repository';
import {
  Driver,
  DriverOrganization,
  DriverProblem,
  licenseExpired,
  sortByName,
} from '../domain/driver';
import { DriverForm } from './driver-form';
import { driversText } from './drivers-text';

@Component({
  selector: 'app-drivers',
  imports: [
    Alert,
    Button,
    DriverForm,
    FormDrawer,
    NgIcon,
    PageHeader,
    PageState,
    Tag,
  ],
  templateUrl: './drivers.html',
})
export class Drivers {
  private readonly repository = inject(DriverRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly today = localDate(new Date());

  protected readonly text = injectText(driversText);
  protected readonly addIcon = lucidePlus;
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<DriverProblem>('load');
  protected readonly organization = signal<DriverOrganization | null>(null);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly editing = signal<Driver | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);
  protected readonly formTitle = computed(() =>
    this.editing() ? this.text().form.editTitle : this.text().form.addTitle,
  );

  constructor() {
    void this.load();
  }

  protected expired(driver: Driver): boolean {
    return licenseExpired(driver.licenseExpiry, this.today);
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

  protected onSaved(driver: Driver): void {
    const others = this.drivers().filter((item) => item.id !== driver.id);
    this.drivers.set(sortByName([...others, driver]));
    this.outcome.set(this.editing() ? 'saved' : 'added');
    this.stopEditing();
    this.status.set('success');
  }

  private open(driver: Driver | null): void {
    this.outcome.set(null);
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
