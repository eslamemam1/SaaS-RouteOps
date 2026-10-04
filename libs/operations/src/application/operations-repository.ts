import {
  DailyTrip,
  OperationChoices,
  OperationsOrganization,
  TripChange,
  TripRecording,
} from '../domain/daily-trip';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class OperationsRepository {
  abstract organization(
    requestedId: string,
  ): Promise<OperationsOrganization | null>;
  // Prepares the day's trips from the routes, then returns them.
  abstract day(
    organization: OperationsOrganization,
    serviceDate: string,
  ): Promise<DailyTrip[]>;
  abstract choices(organization: OperationsOrganization): Promise<OperationChoices>;
  abstract tripRecording(
    organization: OperationsOrganization,
  ): Promise<TripRecording>;
  abstract chooseTripRecording(
    organization: OperationsOrganization,
    recording: TripRecording,
  ): Promise<void>;
  abstract changeTrip(
    organization: OperationsOrganization,
    tripId: string,
    change: TripChange,
  ): Promise<DailyTrip>;
  abstract markDone(
    organization: OperationsOrganization,
    tripId: string,
    done: boolean,
  ): Promise<DailyTrip>;
  abstract cancelForHoliday(
    organization: OperationsOrganization,
    serviceDate: string,
    customerIds: readonly string[],
  ): Promise<DailyTrip[]>;
}
