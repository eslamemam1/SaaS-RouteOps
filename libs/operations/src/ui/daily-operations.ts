import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  PageHeader,
  PageState,
  Tag,
  Tone,
} from '@routeops/shared/ui';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  canMarkDone,
  choiceLabel,
  conflictsByTrip,
  countByStatus,
  customersOnDay,
  DailyTrip,
  emptyTripFilter,
  filterTrips,
  isServiceDate,
  OperationChoice,
  OperationChoices,
  OperationsOrganization,
  OperationsProblem,
  shiftDate,
  sortByTime,
  TripConflict,
  tripDirections,
  TripFilter,
  TripRecording,
  tripRecordings,
  TripStatus,
  tripStatus,
  tripStatuses,
  VehicleOwnership,
  vehicleOwnership,
  vehicleOwnerships,
} from '../domain/daily-trip';
import { ConflictList } from './conflict-list';
import { ExtraTripForm } from './extra-trip-form';
import { HolidayPanel } from './holiday-panel';
import { operationsText } from './operations-text';
import { TripChangeForm } from './trip-change-form';

const noChoices: OperationChoices = {
  customers: [],
  vehicles: [],
  drivers: [],
  routes: [],
};

const statusTones: Record<TripStatus, Tone> = {
  done: 'success',
  planned: 'info',
  cancelled: 'danger',
  unrecorded: 'warning',
};

@Component({
  selector: 'app-daily-operations',
  imports: [
    Alert,
    Button,
    ConflictList,
    ExtraTripForm,
    Field,
    FormDrawer,
    HolidayPanel,
    NgIcon,
    PageHeader,
    PageState,
    Tag,
    TripChangeForm,
  ],
  templateUrl: './daily-operations.html',
  styleUrl: './daily-operations.css',
})
export class DailyOperations {
  private readonly repository = inject(OperationsRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(operationsText);
  protected readonly addIcon = lucidePlus;
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
  protected readonly recordings = tripRecordings;
  protected readonly recording = signal<TripRecording>('automatic');
  protected readonly savingRecording = signal(false);
  protected readonly markingTripId = signal<string | null>(null);
  protected readonly actionProblem = signal<OperationsProblem | null>(null);
  protected readonly addingExtra = signal(false);
  protected readonly confirmingRemoveId = signal<string | null>(null);
  protected readonly directions = tripDirections;
  protected readonly filter = signal<TripFilter>(emptyTripFilter);
  protected readonly visibleTrips = computed(() =>
    filterTrips(
      this.trips(),
      this.filter(),
      this.choices(),
      this.today,
      this.recording(),
    ),
  );
  protected readonly conflicts = computed(() => conflictsByTrip(this.trips()));
  protected readonly counts = computed(() =>
    countByStatus(this.trips(), this.today, this.recording()),
  );
  protected readonly statusChoices = computed(() =>
    tripStatuses.filter(
      (status) => this.counts()[status] > 0 || this.filter().status === status,
    ),
  );
  protected readonly dayCustomers = computed(() =>
    customersOnDay(
      this.trips(),
      this.choices().customers,
      this.filter().customerId,
    ),
  );
  protected readonly filtered = computed(() => {
    const filter = this.filter();
    return Boolean(
      filter.customerId ||
        filter.direction ||
        filter.status ||
        filter.search.trim() ||
        filter.conflictsOnly ||
        filter.ownership,
    );
  });
  protected readonly ownerships = vehicleOwnerships;
  protected readonly hasOtherOwnerships = computed(() =>
    this.choices().vehicles.some((vehicle) => vehicle.ownership !== 'owned'),
  );

  constructor() {
    void this.load();
  }

  protected label(choices: readonly OperationChoice[], id: string): string {
    return choiceLabel(choices, id) || this.text().day.notSet;
  }

  protected ownershipOf(trip: DailyTrip): VehicleOwnership | '' {
    return vehicleOwnership(this.choices().vehicles, trip.vehicleId);
  }

  protected statusOf(trip: DailyTrip): TripStatus {
    return tripStatus(trip, this.today, this.recording());
  }

  protected statusTone(trip: DailyTrip): Tone {
    return statusTones[this.statusOf(trip)];
  }

  protected conflictsOf(trip: DailyTrip): TripConflict[] {
    return this.conflicts().get(trip.id) ?? [];
  }

  protected canMarkDone(trip: DailyTrip): boolean {
    return this.recording() === 'manual' && canMarkDone(trip, this.today);
  }

  protected async chooseRecording(recording: TripRecording): Promise<void> {
    const organization = this.organization();
    const previous = this.recording();
    if (!organization || recording === previous) {
      return;
    }
    this.recording.set(recording);
    this.savingRecording.set(true);
    this.actionProblem.set(null);
    try {
      await this.repository.chooseTripRecording(organization, recording);
    } catch (error) {
      this.recording.set(previous);
      this.actionProblem.set(problemOf(error, 'save'));
    } finally {
      this.savingRecording.set(false);
    }
  }

  protected async markDone(trip: DailyTrip, done: boolean): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    this.markingTripId.set(trip.id);
    this.actionProblem.set(null);
    try {
      const saved = await this.repository.markDone(organization, trip.id, done);
      this.trips.set(
        this.trips().map((item) => (item.id === saved.id ? saved : item)),
      );
    } catch (error) {
      this.actionProblem.set(problemOf(error, 'save'));
    } finally {
      this.markingTripId.set(null);
    }
  }

  protected chooseDate(value: string): void {
    if (isServiceDate(value)) {
      this.serviceDate.set(value);
      void this.loadDay();
    }
  }

  protected filterBy(patch: Partial<TripFilter>): void {
    this.filter.update((filter) => ({ ...filter, ...patch }));
  }

  protected clearFilter(): void {
    this.filter.set(emptyTripFilter);
  }

  protected moveDay(days: number): void {
    this.chooseDate(shiftDate(this.serviceDate(), days));
  }

  protected edit(trip: DailyTrip): void {
    this.addingExtra.set(false);
    this.editing.set(trip);
  }

  protected stopEditing(): void {
    this.editing.set(null);
  }

  protected onChangeDrawer(open: boolean): void {
    if (!open) {
      this.stopEditing();
    }
  }

  protected onExtraDrawer(open: boolean): void {
    if (!open) {
      this.addingExtra.set(false);
    }
  }

  protected onTripSaved(trip: DailyTrip): void {
    this.trips.set(
      sortByTime([...this.trips().filter((item) => item.id !== trip.id), trip]),
    );
    this.editing.set(null);
  }

  protected startExtra(): void {
    this.editing.set(null);
    this.addingExtra.set(true);
  }

  protected onExtraAdded(trip: DailyTrip): void {
    this.trips.set(sortByTime([...this.trips(), trip]));
    this.status.set('success');
    this.addingExtra.set(false);
  }

  protected async remove(trip: DailyTrip): Promise<void> {
    const organization = this.organization();
    if (!organization || !trip.extra) {
      return;
    }
    if (this.confirmingRemoveId() !== trip.id) {
      this.confirmingRemoveId.set(trip.id);
      return;
    }
    this.markingTripId.set(trip.id);
    this.actionProblem.set(null);
    try {
      await this.repository.removeExtraTrip(organization, trip.id);
      const trips = this.trips().filter((item) => item.id !== trip.id);
      this.trips.set(trips);
      if (this.editing()?.id === trip.id) {
        this.editing.set(null);
      }
      if (trips.length === 0) {
        this.status.set('empty');
      }
    } catch (error) {
      this.actionProblem.set(problemOf(error, 'save'));
    } finally {
      this.markingTripId.set(null);
      this.confirmingRemoveId.set(null);
    }
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
      const [choices, recording] = await Promise.all([
        this.repository.choices(organization),
        this.repository.tripRecording(organization),
      ]);
      this.choices.set(choices);
      this.recording.set(recording);
      this.organization.set(organization);
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
    this.addingExtra.set(false);
    this.confirmingRemoveId.set(null);
    this.actionProblem.set(null);
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
    this.problem.set(problemOf(error, 'load'));
    this.status.set('error');
  }
}

function problemOf(
  error: unknown,
  fallback: OperationsProblem,
): OperationsProblem {
  return error instanceof OperationsAccessError ? error.problem : fallback;
}

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
