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
import { Alert, Button, Field } from '@routeops/shared/ui';
import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository } from '../application/driver-repository';
import {
  Driver,
  DriverDetails,
  DriverOrganization,
  DriverProblem,
  emptyDriverDetails,
  payTypes,
} from '../domain/driver';
import { driverDetailsSchema } from './driver-fields';
import { driversText } from './drivers-text';

@Component({
  selector: 'app-driver-form',
  imports: [Alert, Button, Field, FormField],
  templateUrl: './driver-form.html',
})
export class DriverForm {
  private readonly repository = inject(DriverRepository);

  readonly organization = input.required<DriverOrganization>();
  readonly driver = input<Driver | null>(null);
  readonly saved = output<Driver>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(driversText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly payTypes = payTypes;
  protected readonly submitting = signal(false);
  protected readonly problem = signal<DriverProblem | null>(null);
  protected readonly model = signal<DriverDetails>(emptyDriverDetails);
  protected readonly driverForm = form(this.model, (field) => {
    apply(
      field,
      driverDetailsSchema(
        this.problems,
        computed(() => this.organization().currency),
      ),
    );
  });

  constructor() {
    effect(() => {
      const details = detailsOf(this.driver());
      untracked(() => {
        this.driverForm().reset(details);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.driverForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const existing = this.driver();
        const saved = existing
          ? await this.repository.update(
              this.organization(),
              existing.id,
              this.model(),
            )
          : await this.repository.add(this.organization(), this.model());
        this.driverForm().reset(emptyDriverDetails);
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof DriverAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

function detailsOf(driver: Driver | null): DriverDetails {
  if (!driver) {
    return emptyDriverDetails;
  }
  return {
    fullName: driver.fullName,
    phone: driver.phone,
    nationalId: driver.nationalId,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    payType: driver.payType,
    monthlySalary: driver.monthlySalary,
    salaryTrips: driver.salaryTrips,
    outboundPay: driver.outboundPay,
    returnPay: driver.returnPay,
    notes: driver.notes,
    active: driver.active,
  };
}
