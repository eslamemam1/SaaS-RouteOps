import { Component, computed, inject, input, output, signal } from '@angular/core';
import { apply, form, FormField, submit } from '@angular/forms/signals';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button, Field } from '@routeops/shared/ui';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  availableChoices,
  choiceLabel,
  DailyTrip,
  emptyExtraTrip,
  ExtraTripDetails,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
  tripConflicts,
  tripDirections,
  withRoute,
} from '../domain/daily-trip';
import { ConflictList } from './conflict-list';
import { extraTripSchema } from './extra-trip-fields';
import { operationsText } from './operations-text';

@Component({
  selector: 'app-extra-trip-form',
  imports: [Alert, Button, ConflictList, Field, FormField],
  templateUrl: './extra-trip-form.html',
})
export class ExtraTripForm {
  private readonly repository = inject(OperationsRepository);

  readonly organization = input.required<OperationsOrganization>();
  readonly serviceDate = input.required<string>();
  readonly choices = input.required<OperationChoices>();
  // The trips of the day, to warn about vehicle and driver conflicts.
  readonly trips = input<readonly DailyTrip[]>([]);
  readonly added = output<DailyTrip>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(operationsText);
  private readonly problems = computed(() => this.text().problems);

  protected readonly directions = tripDirections;
  protected readonly submitting = signal(false);
  protected readonly problem = signal<OperationsProblem | null>(null);
  protected readonly model = signal<ExtraTripDetails>(emptyExtraTrip);
  protected readonly extraForm = form(this.model, (field) => {
    apply(
      field,
      extraTripSchema(
        this.problems,
        computed(() => this.organization().currency),
      ),
    );
  });

  // The same route name may serve several customers, so each route shows its customer.
  protected readonly routes = computed(() =>
    availableChoices(this.choices().routes, this.model().routeId)
      .map((route) => ({
        id: route.id,
        label: `${route.label} - ${choiceLabel(this.choices().customers, route.customerId)}`,
      }))
      .sort((first, second) => first.label.localeCompare(second.label)),
  );
  protected readonly conflicts = computed(() =>
    tripConflicts({ ...this.model(), id: '', cancelled: false }, this.trips()),
  );
  protected readonly customers = computed(() =>
    availableChoices(this.choices().customers, this.model().customerId),
  );
  protected readonly vehicles = computed(() =>
    availableChoices(this.choices().vehicles, this.model().vehicleId),
  );
  protected readonly drivers = computed(() =>
    availableChoices(this.choices().drivers, this.model().driverId),
  );

  protected useRoute(routeId: string): void {
    this.model.update((details) =>
      withRoute(details, this.choices().routes, routeId),
    );
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.extraForm, async () => {
      this.submitting.set(true);
      this.problem.set(null);
      try {
        const trip = await this.repository.addExtraTrip(
          this.organization(),
          this.serviceDate(),
          this.model(),
        );
        this.extraForm().reset(emptyExtraTrip);
        this.added.emit(trip);
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
