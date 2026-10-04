import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectText } from '@routeops/shared/i18n';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  choiceLabel,
  DailyTrip,
  isServiceDate,
  OperationChoice,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
  shiftDate,
  sortByTime,
  tripStatus,
} from '../domain/daily-trip';
import { HolidayPanel } from './holiday-panel';
import { operationsText } from './operations-text';
import { TripChangeForm } from './trip-change-form';

const noChoices: OperationChoices = {
  customers: [],
  vehicles: [],
  drivers: [],
  routes: [],
};

@Component({
  selector: 'app-daily-operations',
  imports: [HolidayPanel, RouterLink, TripChangeForm],
  templateUrl: './daily-operations.html',
})
export class DailyOperations {
  private readonly repository = inject(OperationsRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(operationsText);
  protected readonly today = localDate(new Date());
  protected readonly serviceDate = signal(this.today);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<OperationsProblem>('load');
  protected readonly organization = signal<OperationsOrganization | null>(null);
  protected readonly trips = signal<DailyTrip[]>([]);
  protected readonly choices = signal<OperationChoices>(noChoices);
  protected readonly editing = signal<DailyTrip | null>(null);

  constructor() {
    void this.load();
  }

  protected label(choices: readonly OperationChoice[], id: string): string {
    return choiceLabel(choices, id) || this.text().day.notSet;
  }

  protected statusOf(trip: DailyTrip) {
    return tripStatus(trip, this.today);
  }

  protected chooseDate(value: string): void {
    if (isServiceDate(value)) {
      this.serviceDate.set(value);
      void this.loadDay();
    }
  }

  protected moveDay(days: number): void {
    this.chooseDate(shiftDate(this.serviceDate(), days));
  }

  protected edit(trip: DailyTrip): void {
    this.editing.set(trip);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onTripSaved(trip: DailyTrip): void {
    this.trips.set(
      sortByTime([...this.trips().filter((item) => item.id !== trip.id), trip]),
    );
    this.editing.set(null);
  }

  protected onHolidayRecorded(trips: DailyTrip[]): void {
    this.trips.set(sortByTime(trips));
    this.editing.set(null);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const requestedId =
        this.activatedRoute.snapshot.paramMap.get('organizationId') ?? '';
      const organization = await this.repository.organization(requestedId);
      if (!organization) {
        this.problem.set('organization');
        this.status.set('error');
        return;
      }
      this.organization.set(organization);
      this.choices.set(await this.repository.choices(organization));
      await this.loadDay();
    } catch (error) {
      this.fail(error);
    }
  }

  private async loadDay(): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    const serviceDate = this.serviceDate();
    this.status.set('loading');
    this.editing.set(null);
    try {
      const trips = await this.repository.day(organization, serviceDate);
      if (serviceDate !== this.serviceDate()) {
        return;
      }
      this.trips.set(sortByTime(trips));
      this.status.set(trips.length === 0 ? 'empty' : 'success');
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
    this.problem.set(
      error instanceof OperationsAccessError ? error.problem : 'load',
    );
    this.status.set('error');
  }
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
