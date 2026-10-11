import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideCalendarOff,
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideBus,
  lucideInfo,
  lucideMessageSquareText,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUserRound,
} from '@ng-icons/lucide';
import {
  formatDayWithWeekday,
  formatTime,
  injectText,
  LanguageService,
} from '@routeops/shared/i18n';
import {
  Alert,
  Button,
  Field,
  FormDrawer,
  injectListView,
  PageHeader,
  PageState,
  Tag,
  Tone,
  paginate,
  Pager,
  ViewSwitch,
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
  RecordingPeriod,
  recordingOn,
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
  withRecordingFrom,
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

type Notice = 'changed' | 'added' | 'removed' | 'allDone' | 'holiday';

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
    RouterLink,
    Tag,
    TripChangeForm,
    Pager,
    ViewSwitch,
  ],
  templateUrl: './daily-operations.html',
  styleUrl: './daily-operations.css',
})
export class DailyOperations {
  private readonly repository = inject(OperationsRepository);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly text = injectText(operationsText);
  private readonly language = inject(LanguageService).language;
  protected readonly icons = {
    add: lucidePlus,
    holiday: lucideCalendarOff,
    previous: lucideChevronLeft,
    next: lucideChevronRight,
    info: lucideInfo,
    done: lucideCheck,
    change: lucidePencil,
    remove: lucideTrash2,
    conflict: lucideTriangleAlert,
    driver: lucideUserRound,
    vehicle: lucideBus,
    notes: lucideMessageSquareText,
  };
  protected readonly view = injectListView('operations');
  protected readonly today = localDate(new Date());
  protected readonly serviceDate = signal(this.today);
  protected readonly dayLabel = computed(() =>
    formatDayWithWeekday(this.serviceDate(), this.language()),
  );
  protected readonly recordingOpen = signal(false);
  protected readonly holidayOpen = signal(false);
  protected readonly status = signal<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  protected readonly problem = signal<OperationsProblem>('load');
  protected readonly organization = signal<OperationsOrganization | null>(null);
  protected readonly trips = signal<DailyTrip[]>([]);
  protected readonly choices = signal<OperationChoices>(noChoices);
  protected readonly editing = signal<DailyTrip | null>(null);
  protected readonly recordings = tripRecordings;
  private readonly recordingPeriods = signal<RecordingPeriod[]>([]);
  protected readonly recording = computed(() =>
    recordingOn(this.recordingPeriods(), this.today),
  );
  protected readonly dayRecording = computed(() =>
    recordingOn(this.recordingPeriods(), this.serviceDate()),
  );
  protected readonly savingRecording = signal(false);
  protected readonly markingTripId = signal<string | null>(null);
  protected readonly actionProblem = signal<OperationsProblem | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly markingAll = signal(false);
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
      this.dayRecording(),
    ),
  );
  protected readonly pages = paginate(this.visibleTrips, {
    size: 50,
    resetOn: () => [this.serviceDate(), this.filter()],
  });
  protected readonly conflicts = computed(() => conflictsByTrip(this.trips()));
  protected readonly counts = computed(() =>
    countByStatus(this.trips(), this.today, this.dayRecording()),
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
  protected readonly markable = computed(() =>
    this.visibleTrips().filter(
      (trip) => !trip.done && this.canMarkDone(trip),
    ),
  );
  protected readonly ownerships = vehicleOwnerships;
  protected readonly hasOtherOwnerships = computed(() =>
    this.choices().vehicles.some((vehicle) => vehicle.ownership !== 'owned'),
  );

  constructor() {
    void this.load();
  }

  protected time(value: string): string {
    return formatTime(value, this.language());
  }

  protected label(choices: readonly OperationChoice[], id: string): string {
    return choiceLabel(choices, id) || this.text().day.notSet;
  }

  protected ownershipOf(trip: DailyTrip): VehicleOwnership | '' {
    return vehicleOwnership(this.choices().vehicles, trip.vehicleId);
  }

  protected statusOf(trip: DailyTrip): TripStatus {
    return tripStatus(trip, this.today, this.dayRecording());
  }

  protected statusTone(trip: DailyTrip): Tone {
    return statusTones[this.statusOf(trip)];
  }

  protected conflictsOf(trip: DailyTrip): TripConflict[] {
    return this.conflicts().get(trip.id) ?? [];
  }

  protected canMarkDone(trip: DailyTrip): boolean {
    return this.dayRecording() === 'manual' && canMarkDone(trip, this.today);
  }

  protected async chooseRecording(recording: TripRecording): Promise<void> {
    const organization = this.organization();
    const previous = this.recordingPeriods();
    if (!organization || recording === this.recording()) {
      return;
    }
    this.recordingPeriods.set(
      withRecordingFrom(previous, this.today, recording),
    );
    this.savingRecording.set(true);
    this.actionProblem.set(null);
    try {
      await this.repository.chooseTripRecording(organization, recording);
    } catch (error) {
      this.recordingPeriods.set(previous);
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

  protected async markAllDone(): Promise<void> {
    const organization = this.organization();
    if (!organization) {
      return;
    }
    this.markingAll.set(true);
    this.actionProblem.set(null);
    this.notice.set(null);
    try {
      for (const trip of this.markable()) {
        const saved = await this.repository.markDone(organization, trip.id, true);
        this.trips.update((trips) =>
          trips.map((item) => (item.id === saved.id ? saved : item)),
        );
      }
      this.notice.set('allDone');
    } catch (error) {
      this.actionProblem.set(problemOf(error, 'save'));
    } finally {
      this.markingAll.set(false);
    }
  }

  protected retry(): void {
    void (this.organization() ? this.loadDay() : this.load());
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

  protected showStatus(status: TripStatus | ''): void {
    this.filterBy({ status, conflictsOnly: false });
  }

  protected toggleConflicts(): void {
    this.filterBy({ status: '', conflictsOnly: !this.filter().conflictsOnly });
  }

  protected statusToneOf(status: TripStatus): Tone {
    return statusTones[status];
  }

  protected openHoliday(): void {
    this.editing.set(null);
    this.addingExtra.set(false);
    this.holidayOpen.set(true);
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
    this.notice.set('changed');
  }

  protected startExtra(): void {
    this.editing.set(null);
    this.addingExtra.set(true);
  }

  protected onExtraAdded(trip: DailyTrip): void {
    this.trips.set(sortByTime([...this.trips(), trip]));
    this.status.set('success');
    this.addingExtra.set(false);
    this.notice.set('added');
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
      this.notice.set('removed');
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
    this.holidayOpen.set(false);
    this.notice.set('holiday');
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
      const [choices, periods] = await Promise.all([
        this.repository.choices(organization),
        this.repository.tripRecordings(organization),
      ]);
      this.choices.set(choices);
      this.recordingPeriods.set(periods);
      this.organization.set(organization);
      const requestedDate =
        this.activatedRoute.snapshot.queryParamMap.get('date') ?? '';
      if (isServiceDate(requestedDate)) {
        this.serviceDate.set(requestedDate);
      }
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
    this.holidayOpen.set(false);
    this.confirmingRemoveId.set(null);
    this.actionProblem.set(null);
    this.notice.set(null);
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
