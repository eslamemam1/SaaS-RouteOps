import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import {
  licenseExpired,
  sortByPlate,
  Vehicle,
  VehicleOrganization,
  VehicleProblem,
} from '../domain/vehicle';
import { VehicleForm } from './vehicle-form';
import { vehiclesText } from './vehicles-text';

@Component({
  selector: 'app-vehicles',
  imports: [RouterLink, VehicleForm],
  templateUrl: './vehicles.html',
})
export class Vehicles {
  private readonly repository = inject(VehicleRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly today = localDate(new Date());

  protected readonly text = injectText(vehiclesText);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<VehicleProblem>('load');
  protected readonly organization = signal<VehicleOrganization | null>(null);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly editing = signal<Vehicle | null>(null);

  constructor() {
    void this.load();
  }

  protected expired(vehicle: Vehicle): boolean {
    return licenseExpired(vehicle.licenseExpiry, this.today);
  }

  protected edit(vehicle: Vehicle): void {
    this.editing.set(vehicle);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onSaved(vehicle: Vehicle): void {
    const others = this.vehicles().filter((item) => item.id !== vehicle.id);
    this.vehicles.set(sortByPlate([...others, vehicle]));
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
      const vehicles = await this.repository.list(organization);
      this.vehicles.set(vehicles);
      this.status.set(vehicles.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.problem.set(
        error instanceof VehicleAccessError ? error.problem : 'load',
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
