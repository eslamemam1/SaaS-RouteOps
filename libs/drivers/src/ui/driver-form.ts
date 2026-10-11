import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Avatar, Button, Field } from '@routeops/shared/ui';
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
import { shrinkPhoto } from './driver-photo';
import { driversText } from './drivers-text';

// null keeps the current photo.
type PhotoChoice =
  | { readonly photo: Blob; readonly preview: string }
  | 'remove'
  | null;

// photoSaved is false when the details were saved but the photo was not.
export interface DriverSaved {
  readonly driver: Driver;
  readonly photoSaved: boolean;
}

@Component({
  selector: 'app-driver-form',
  imports: [Alert, Avatar, Button, Field, FormField],
  templateUrl: './driver-form.html',
  styleUrl: './driver-form.css',
})
export class DriverForm {
  private readonly repository = inject(DriverRepository);

  readonly organization = input.required<DriverOrganization>();
  readonly driver = input<Driver | null>(null);
  readonly saved = output<DriverSaved>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(driversText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly payTypes = payTypes;
  protected readonly submitting = signal(false);
  protected readonly problem = signal<DriverProblem | null>(null);
  protected readonly model = signal<DriverDetails>(emptyDriverDetails);
  protected readonly photoChoice = signal<PhotoChoice>(null);
  protected readonly shrinking = signal(false);
  protected readonly photoProblem = signal<DriverProblem | null>(null);
  protected readonly photoPreview = computed(() => {
    const choice = this.photoChoice();
    if (choice === 'remove') {
      return null;
    }
    return choice ? choice.preview : (this.driver()?.photo?.url ?? null);
  });
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
        this.choosePhotoOf(null);
        this.photoProblem.set(null);
      });
    });
    inject(DestroyRef).onDestroy(() => this.choosePhotoOf(null));
  }

  protected async onPhotoPicked(event: Event): Promise<void> {
    const picker = event.target as HTMLInputElement;
    const file = picker.files?.[0];
    picker.value = '';
    if (!file) {
      return;
    }
    this.shrinking.set(true);
    this.photoProblem.set(null);
    const photo = await shrinkPhoto(file);
    this.shrinking.set(false);
    if (!photo) {
      this.photoProblem.set('photo');
      return;
    }
    this.choosePhotoOf({ photo, preview: URL.createObjectURL(photo) });
  }

  protected removePhoto(): void {
    this.photoProblem.set(null);
    this.choosePhotoOf('remove');
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
        const result = await this.savePhoto(saved);
        this.driverForm().reset(emptyDriverDetails);
        this.choosePhotoOf(null);
        this.saved.emit(result);
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

  private async savePhoto(driver: Driver): Promise<DriverSaved> {
    const choice = this.photoChoice();
    try {
      if (choice === 'remove') {
        return {
          driver: driver.photo
            ? await this.repository.removePhoto(this.organization(), driver)
            : driver,
          photoSaved: true,
        };
      }
      if (choice) {
        return {
          driver: await this.repository.setPhoto(
            this.organization(),
            driver,
            choice.photo,
          ),
          photoSaved: true,
        };
      }
      return { driver, photoSaved: true };
    } catch {
      return { driver, photoSaved: false };
    }
  }

  private choosePhotoOf(choice: PhotoChoice): void {
    const previous = this.photoChoice();
    if (previous && previous !== 'remove') {
      URL.revokeObjectURL(previous.preview);
    }
    this.photoChoice.set(choice);
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
