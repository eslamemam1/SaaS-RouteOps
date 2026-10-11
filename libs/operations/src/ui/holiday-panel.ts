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
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button } from '@routeops/shared/ui';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  choiceLabel,
  customersWithRunningTrips,
  DailyTrip,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
} from '../domain/daily-trip';
import { operationsText } from './operations-text';

@Component({
  selector: 'app-holiday-panel',
  imports: [Alert, Button],
  templateUrl: './holiday-panel.html',
})
export class HolidayPanel {
  private readonly repository = inject(OperationsRepository);

  readonly organization = input.required<OperationsOrganization>();
  readonly serviceDate = input.required<string>();
  readonly trips = input.required<readonly DailyTrip[]>();
  readonly choices = input.required<OperationChoices>();
  readonly recorded = output<DailyTrip[]>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(operationsText);
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly submitting = signal(false);
  protected readonly confirming = signal(false);
  protected readonly problem = signal<OperationsProblem | null>(null);

  // Trips already marked done happened, so a holiday leaves them alone.
  private readonly running = computed(() =>
    this.trips().filter((trip) => !trip.cancelled && !trip.done),
  );

  protected readonly toCancel = computed(
    () =>
      this.running().filter((trip) => this.selected().has(trip.customerId))
        .length,
  );

  protected readonly customers = computed(() =>
    customersWithRunningTrips(this.trips()).map((id) => ({
      id,
      label: choiceLabel(this.choices().customers, id),
      trips: this.running().filter((trip) => trip.customerId === id).length,
    })),
  );

  constructor() {
    effect(() => {
      this.serviceDate();
      untracked(() => {
        this.selected.set(new Set());
        this.confirming.set(false);
        this.problem.set(null);
      });
    });
  }

  protected toggle(customerId: string, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) {
      next.add(customerId);
    } else {
      next.delete(customerId);
    }
    this.selected.set(next);
    this.confirming.set(false);
  }

  protected async record(): Promise<void> {
    if (!this.confirming()) {
      this.confirming.set(true);
      return;
    }
    this.confirming.set(false);
    this.submitting.set(true);
    this.problem.set(null);
    try {
      const trips = await this.repository.cancelForHoliday(
        this.organization(),
        this.serviceDate(),
        [...this.selected()],
      );
      this.selected.set(new Set());
      this.recorded.emit(trips);
    } catch (error) {
      this.problem.set(
        error instanceof OperationsAccessError ? error.problem : 'save',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
