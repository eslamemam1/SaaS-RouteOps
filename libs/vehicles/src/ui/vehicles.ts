import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideBus, lucidePlus } from '@ng-icons/lucide';
import { formatDay, injectText, LanguageService } from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  injectListView,
  PageHeader,
  Pager,
  PageState,
  paginate,
  Select,
  SelectOption,
  Tag,
  ViewSwitch,
} from '@routeops/shared/ui';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import {
  isVehicleOwnership,
  licenseExpired,
  ofOwnership,
  sortByPlate,
  Vehicle,
  VehicleOrganization,
  VehicleOwnership,
  vehicleOwnerships,
  VehicleProblem,
} from '../domain/vehicle';
import { VehicleForm } from './vehicle-form';
import { vehiclesText } from './vehicles-text';

@Component({
  selector: 'app-vehicles',
  imports: [
    Alert,
    Button,
    Field,
    FormDrawer,
    NgIcon,
    PageHeader,
    Pager,
    PageState,
    RouterLink,
    Select,
    SelectOption,
    Tag,
    VehicleForm,
    ViewSwitch,
  ],
  templateUrl: './vehicles.html',
})
export class Vehicles {
  private readonly repository = inject(VehicleRepository);
  private readonly route = inject(ActivatedRoute);
  private readonly today = localDate(new Date());

  private readonly language = inject(LanguageService).language;
  protected readonly text = injectText(vehiclesText);
  protected readonly addIcon = lucidePlus;
  protected readonly vehicleIcon = lucideBus;
  protected readonly view = injectListView('vehicles');
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<VehicleProblem>('load');
  protected readonly organization = signal<VehicleOrganization | null>(null);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly editing = signal<Vehicle | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | 'removed' | null>(
    null,
  );
  protected readonly confirmingRemoveId = signal<string | null>(null);
  protected readonly actionProblem = signal<VehicleProblem | null>(null);
  protected readonly blockingRoutes = signal<readonly string[]>([]);
  protected readonly removing = signal(false);
  protected readonly formTitle = computed(() =>
    this.editing() ? this.text().form.editTitle : this.text().form.addTitle,
  );
  protected readonly ownerships = vehicleOwnerships;
  protected readonly ownershipFilter = signal<VehicleOwnership | ''>('');
  protected readonly visibleVehicles = computed(() =>
    ofOwnership(this.vehicles(), this.ownershipFilter()),
  );
  protected readonly pages = paginate(this.visibleVehicles, {
    resetOn: this.ownershipFilter,
  });

  constructor() {
    void this.load();
  }

  protected day(value: string): string {
    return formatDay(value, this.language());
  }

  protected retry(): void {
    void this.load();
  }

  protected filterBy(value: string): void {
    this.ownershipFilter.set(isVehicleOwnership(value) ? value : '');
  }

  protected expired(vehicle: Vehicle): boolean {
    return licenseExpired(vehicle.licenseExpiry, this.today);
  }

  protected add(): void {
    this.open(null);
  }

  protected edit(vehicle: Vehicle): void {
    this.open(vehicle);
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

  protected onSaved(vehicle: Vehicle): void {
    const others = this.vehicles().filter((item) => item.id !== vehicle.id);
    this.vehicles.set(sortByPlate([...others, vehicle]));
    this.outcome.set(this.editing() ? 'saved' : 'added');
    this.stopEditing();
    this.status.set('success');
  }

  protected async remove(vehicle: Vehicle): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    if (this.confirmingRemoveId() !== vehicle.id) {
      this.confirmingRemoveId.set(vehicle.id);
      return;
    }
    this.removing.set(true);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    try {
      await this.repository.remove(organization, vehicle);
      const vehicles = this.vehicles().filter((item) => item.id !== vehicle.id);
      this.vehicles.set(vehicles);
      if (this.editing()?.id === vehicle.id) {
        this.stopEditing();
      }
      this.outcome.set('removed');
      this.status.set(vehicles.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.actionProblem.set(
        error instanceof VehicleAccessError ? error.problem : 'remove',
      );
      this.blockingRoutes.set(
        error instanceof VehicleAccessError ? error.routes : [],
      );
    } finally {
      this.removing.set(false);
      this.confirmingRemoveId.set(null);
    }
  }

  private open(vehicle: Vehicle | null): void {
    this.outcome.set(null);
    this.actionProblem.set(null);
    this.blockingRoutes.set([]);
    this.confirmingRemoveId.set(null);
    this.editing.set(vehicle);
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
