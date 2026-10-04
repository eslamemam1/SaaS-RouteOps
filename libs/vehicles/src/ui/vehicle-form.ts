import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import {
  emptyVehicleDetails,
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
  VehicleProblem,
  vehicleTypes,
} from '../domain/vehicle';
import { vehicleDetailsSchema } from './vehicle-fields';
import { vehiclesText } from './vehicles-text';

@Component({
  selector: 'app-vehicle-form',
  imports: [FormField],
  templateUrl: './vehicle-form.html',
})
export class VehicleForm {
  private readonly repository = inject(VehicleRepository);

  readonly organization = input.required<VehicleOrganization>();
  readonly vehicle = input<Vehicle | null>(null);
  readonly saved = output<Vehicle>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(vehiclesText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly types = vehicleTypes;
  protected readonly submitting = signal(false);
  protected readonly outcome = signal<'added' | 'saved' | null>(null);
  protected readonly problem = signal<VehicleProblem | null>(null);
  protected readonly model = signal<VehicleDetails>(emptyVehicleDetails);
  protected readonly vehicleForm = form(this.model, (field) => {
    apply(
      field,
      vehicleDetailsSchema(this.problems, new Date().getFullYear()),
    );
  });

  constructor() {
    effect(() => {
      const details = detailsOf(this.vehicle());
      untracked(() => {
        this.vehicleForm().reset(details);
        this.outcome.set(null);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.vehicleForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const existing = this.vehicle();
        const saved = existing
          ? await this.repository.update(
              this.organization(),
              existing.id,
              this.model(),
            )
          : await this.repository.add(this.organization(), this.model());
        this.vehicleForm().reset(emptyVehicleDetails);
        this.outcome.set(existing ? 'saved' : 'added');
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof VehicleAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

function detailsOf(vehicle: Vehicle | null): VehicleDetails {
  if (!vehicle) {
    return emptyVehicleDetails;
  }
  return {
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    model: vehicle.model,
    year: vehicle.year,
    seats: vehicle.seats,
    licenseExpiry: vehicle.licenseExpiry,
    notes: vehicle.notes,
    active: vehicle.active,
  };
}
