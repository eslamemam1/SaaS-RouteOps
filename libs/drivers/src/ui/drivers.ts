import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
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
  imports: [DriverForm, RouterLink],
  templateUrl: './drivers.html',
})
export class Drivers {
  private readonly repository = inject(DriverRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly today = localDate(new Date());

  protected readonly text = injectText(driversText);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<DriverProblem>('load');
  protected readonly organization = signal<DriverOrganization | null>(null);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly editing = signal<Driver | null>(null);

  constructor() {
    void this.load();
  }

  protected expired(driver: Driver): boolean {
    return licenseExpired(driver.licenseExpiry, this.today);
  }

  protected edit(driver: Driver): void {
    this.editing.set(driver);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onSaved(driver: Driver): void {
    const others = this.drivers().filter((item) => item.id !== driver.id);
    this.drivers.set(sortByName([...others, driver]));
    this.editing.set(null);
    this.status.set('success');
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
