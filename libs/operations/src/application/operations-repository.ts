import {
  DailyTrip,
  ExtraTripDetails,
  OperationChoices,
  OperationsOrganization,
  PastDays,
  RecordingPeriod,
  TripChange,
  TripOmission,
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
  // Route trips a member deleted from the day; each can be restored.
  abstract tripOmissions(
    organization: OperationsOrganization,
    serviceDate: string,
  ): Promise<TripOmission[]>;
  abstract choices(organization: OperationsOrganization): Promise<OperationChoices>;
  abstract tripRecordings(
    organization: OperationsOrganization,
  ): Promise<RecordingPeriod[]>;
  // Applies from the organization's today on; past days keep their way.
  abstract chooseTripRecording(
    organization: OperationsOrganization,
    recording: TripRecording,
  ): Promise<void>;
  abstract changeTrip(
    organization: OperationsOrganization,
    trip: DailyTrip,
    change: TripChange,
    dayTrips?: readonly DailyTrip[],
  ): Promise<DailyTrip>;
  abstract markDone(
    organization: OperationsOrganization,
    tripId: string,
    done: boolean,
  ): Promise<DailyTrip>;
  abstract addExtraTrip(
    organization: OperationsOrganization,
    serviceDate: string,
    details: ExtraTripDetails,
    dayTrips?: readonly DailyTrip[],
  ): Promise<DailyTrip>;
  // Removes a trip from the day as if it was never there, including a route
  // trip that was marked done by mistake.
  abstract removeTrip(
    organization: OperationsOrganization,
    tripId: string,
  ): Promise<void>;
  // Puts a deleted route trip back on the day from the route.
  abstract restoreOmittedTrip(
    organization: OperationsOrganization,
    omission: TripOmission,
  ): Promise<void>;
  abstract cancelForHoliday(
    organization: OperationsOrganization,
    serviceDate: string,
    customerIds: readonly string[],
  ): Promise<DailyTrip[]>;
  // Opens each past day and adds the chosen routes' trips on the days they
  // run; returns how many trips were added.
  abstract addRouteTrips(
    organization: OperationsOrganization,
    routeIds: readonly string[],
    days: PastDays,
    today: string,
  ): Promise<number>;
}
