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
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  availableChoices,
  changeOf,
  changeReasons,
  choiceLabel,
  DailyTrip,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
  TripChange,
} from '../domain/daily-trip';
import { operationsText } from './operations-text';
import { tripChangeSchema } from './trip-change-fields';

@Component({
  selector: 'app-trip-change-form',
  imports: [FormField],
  templateUrl: './trip-change-form.html',
})
export class TripChangeForm {
  private readonly repository = inject(OperationsRepository);

  readonly organization = input.required<OperationsOrganization>();
  readonly trip = input.required<DailyTrip>();
  readonly choices = input.required<OperationChoices>();
  readonly saved = output<DailyTrip>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(operationsText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly reasons = changeReasons;
  protected readonly submitting = signal(false);
  protected readonly problem = signal<OperationsProblem | null>(null);
  protected readonly model = signal<TripChange>({
    vehicleId: '',
    driverId: '',
    cancelled: false,
    reason: '',
    notes: '',
  });
  protected readonly changeForm = form(this.model, (field) => {
    apply(field, tripChangeSchema(this.problems));
  });

  protected readonly routeName = computed(() =>
    choiceLabel(this.choices().routes, this.trip().routeId),
  );
  protected readonly vehicles = computed(() =>
    availableChoices(this.choices().vehicles, this.model().vehicleId),
  );
  protected readonly drivers = computed(() =>
    availableChoices(this.choices().drivers, this.model().driverId),
  );

  constructor() {
    effect(() => {
      const change = changeOf(this.trip());
      untracked(() => {
        this.changeForm().reset(change);
        this.problem.set(null);
      });
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.changeForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const saved = await this.repository.changeTrip(
          this.organization(),
          this.trip().id,
          this.model(),
        );
        this.saved.emit(saved);
        return undefined;
      } catch (error) {
        const problem =
          error instanceof OperationsAccessError ? error.problem : 'save';
        this.problem.set(problem);
        return [{ kind: 'server', message: this.problems()[problem] }];
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
