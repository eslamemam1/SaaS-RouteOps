import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { injectText } from '@routeops/shared/i18n';
import { Alert, Button, Field, Tag } from '@routeops/shared/ui';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  choiceLabel,
  dayCount,
  monthSoFar,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
  PastDays,
  pastDaysError,
  shiftDate,
  suggestedPastDays,
} from '../domain/daily-trip';
import { operationsText } from './operations-text';

export interface RouteTripsAdded {
  readonly count: number;
  readonly days: PastDays;
}

type DaysChoice = 'thisDay' | 'monthSoFar';

@Component({
  selector: 'app-past-routes-panel',
  imports: [Alert, Button, Field, Tag],
  templateUrl: './past-routes-panel.html',
  styleUrl: './past-routes-panel.css',
})
export class PastRoutesPanel {
  private readonly repository = inject(OperationsRepository);

  readonly organization = input.required<OperationsOrganization>();
  readonly serviceDate = input.required<string>();
  readonly today = input.required<string>();
  readonly choices = input.required<OperationChoices>();
  readonly added = output<RouteTripsAdded>();
  readonly cancelled = output<void>();

  protected readonly text = injectText(operationsText);
  protected readonly from = linkedSignal(
    () => suggestedPastDays(this.serviceDate(), this.today()).from,
  );
  protected readonly to = linkedSignal(
    () => suggestedPastDays(this.serviceDate(), this.today()).to,
  );
  protected readonly yesterday = computed(() => shiftDate(this.today(), -1));
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly submitting = signal(false);
  protected readonly problem = signal<OperationsProblem | null>(null);

  protected readonly daysProblem = computed(() =>
    pastDaysError({ from: this.from(), to: this.to() }, this.today()),
  );
  protected readonly days = computed(() =>
    this.daysProblem() ? 0 : dayCount(this.from(), this.to()),
  );

  // A past shown day is offered on its own; the month so far always is.
  protected readonly daysChoices = computed(() => {
    const choices: DaysChoice[] =
      this.serviceDate() < this.today()
        ? ['thisDay', 'monthSoFar']
        : ['monthSoFar'];
    return choices.map((choice) => ({
      choice,
      days: this.daysOf(choice),
    }));
  });

  protected readonly routes = computed(() => {
    const { routes, customers } = this.choices();
    return [...routes]
      .sort((first, second) => Number(second.active) - Number(first.active))
      .map((route) => ({
        ...route,
        customer: choiceLabel(customers, route.customerId),
      }));
  });

  protected readonly allSelected = computed(
    () =>
      this.routes().length > 0 &&
      this.routes().every((route) => this.selected().has(route.id)),
  );

  protected isChosen(days: PastDays): boolean {
    return this.from() === days.from && this.to() === days.to;
  }

  protected chooseDays(days: PastDays): void {
    this.from.set(days.from);
    this.to.set(days.to);
    this.problem.set(null);
  }

  protected setFrom(value: string): void {
    this.from.set(value);
    this.problem.set(null);
  }

  protected setTo(value: string): void {
    this.to.set(value);
    this.problem.set(null);
  }

  protected toggle(routeId: string, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) {
      next.add(routeId);
    } else {
      next.delete(routeId);
    }
    this.selected.set(next);
    this.problem.set(null);
  }

  protected toggleAll(): void {
    this.selected.set(
      this.allSelected()
        ? new Set()
        : new Set(this.routes().map((route) => route.id)),
    );
    this.problem.set(null);
  }

  protected async submit(): Promise<void> {
    const days = { from: this.from(), to: this.to() };
    this.submitting.set(true);
    this.problem.set(null);
    try {
      const count = await this.repository.addRouteTrips(
        this.organization(),
        [...this.selected()],
        days,
        this.today(),
      );
      this.added.emit({ count, days });
    } catch (error) {
      this.problem.set(
        error instanceof OperationsAccessError ? error.problem : 'save',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private daysOf(choice: DaysChoice): PastDays {
    return choice === 'thisDay'
      ? { from: this.serviceDate(), to: this.serviceDate() }
      : monthSoFar(this.today());
  }
}
