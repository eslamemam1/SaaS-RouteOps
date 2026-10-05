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
  host: { class: 'ro-card' },
})
export class HolidayPanel {
  private readonly repository = inject(OperationsRepository);

  readonly organization = input.required<OperationsOrganization>();
  readonly serviceDate = input.required<string>();
  readonly trips = input.required<readonly DailyTrip[]>();
  readonly choices = input.required<OperationChoices>();
  readonly recorded = output<DailyTrip[]>();

  protected readonly text = injectText(operationsText);
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly submitting = signal(false);
  protected readonly done = signal(false);
  protected readonly problem = signal<OperationsProblem | null>(null);

  protected readonly customers = computed(() =>
    customersWithRunningTrips(this.trips()).map((id) => ({
      id,
      label: choiceLabel(this.choices().customers, id),
    })),
  );

  constructor() {
    effect(() => {
      this.serviceDate();
      untracked(() => {
        this.selected.set(new Set());
        this.done.set(false);
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
    this.done.set(false);
  }

  protected async record(): Promise<void> {
    this.submitting.set(true);
    this.problem.set(null);
    try {
      const trips = await this.repository.cancelForHoliday(
        this.organization(),
        this.serviceDate(),
        [...this.selected()],
      );
      this.selected.set(new Set());
      this.done.set(true);
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
