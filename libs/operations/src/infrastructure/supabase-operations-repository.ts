import { toMinorUnits } from '@routeops/shared/money';
import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  DailyTrip,
  ExtraTripDetails,
  extraTripError,
  isServiceDate,
  memberOrganization,
  OperationChoices,
  OperationsOrganization,
  PastDays,
  pastDaysError,
  RecordingPeriod,
  TripChange,
  tripChangeError,
  TripOmission,
  TripRecording,
} from '../domain/daily-trip';
import { OperationsGateway } from './operations-gateway';

export class SupabaseOperationsRepository extends OperationsRepository {
  constructor(private readonly gateway: OperationsGateway) {
    super();
  }

  async organization(
    requestedId: string,
  ): Promise<OperationsOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new OperationsAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  async day(
    organization: OperationsOrganization,
    serviceDate: string,
  ): Promise<DailyTrip[]> {
    if (!isServiceDate(serviceDate)) {
      throw new OperationsAccessError('date');
    }
    await this.gateway.prepareDay(organization.id, serviceDate);
    return this.gateway.listTrips(organization.id, serviceDate);
  }

  tripOmissions(
    organization: OperationsOrganization,
    serviceDate: string,
  ): Promise<TripOmission[]> {
    if (!isServiceDate(serviceDate)) {
      return Promise.reject(new OperationsAccessError('date'));
    }
    return this.gateway.listTripOmissions(organization.id, serviceDate);
  }

  choices(organization: OperationsOrganization): Promise<OperationChoices> {
    return this.gateway.listChoices(organization.id);
  }

  tripRecordings(
    organization: OperationsOrganization,
  ): Promise<RecordingPeriod[]> {
    return this.gateway.listTripRecordings(organization.id);
  }

  chooseTripRecording(
    organization: OperationsOrganization,
    recording: TripRecording,
  ): Promise<void> {
    return this.gateway.saveTripRecording(organization.id, recording);
  }

  async changeTrip(
    organization: OperationsOrganization,
    tripId: string,
    change: TripChange,
  ): Promise<DailyTrip> {
    const problem = tripChangeError(change);
    if (problem) {
      throw new OperationsAccessError(problem);
    }
    return this.gateway.updateTrip(organization.id, tripId, change);
  }

  markDone(
    organization: OperationsOrganization,
    tripId: string,
    done: boolean,
  ): Promise<DailyTrip> {
    return this.gateway.updateDone(organization.id, tripId, done);
  }

  async addExtraTrip(
    organization: OperationsOrganization,
    serviceDate: string,
    details: ExtraTripDetails,
  ): Promise<DailyTrip> {
    if (!isServiceDate(serviceDate)) {
      throw new OperationsAccessError('date');
    }
    const problem = extraTripError(details, organization.currency);
    if (problem) {
      throw new OperationsAccessError(problem);
    }
    return this.gateway.insertExtraTrip(
      organization.id,
      serviceDate,
      details,
      toMinorUnits(details.tripPrice, organization.currency) ?? null,
    );
  }

  removeTrip(
    organization: OperationsOrganization,
    tripId: string,
  ): Promise<void> {
    return this.gateway.deleteTrip(organization.id, tripId);
  }

  restoreOmittedTrip(
    organization: OperationsOrganization,
    omission: TripOmission,
  ): Promise<void> {
    return this.gateway.restoreOmittedTrip(organization.id, omission);
  }

  async cancelForHoliday(
    organization: OperationsOrganization,
    serviceDate: string,
    customerIds: readonly string[],
  ): Promise<DailyTrip[]> {
    if (customerIds.length === 0) {
      throw new OperationsAccessError('customers');
    }
    await this.gateway.cancelCustomerTrips(
      organization.id,
      serviceDate,
      customerIds,
    );
    return this.gateway.listTrips(organization.id, serviceDate);
  }

  async addRouteTrips(
    organization: OperationsOrganization,
    routeIds: readonly string[],
    days: PastDays,
    today: string,
  ): Promise<number> {
    if (routeIds.length === 0) {
      throw new OperationsAccessError('routes');
    }
    const problem = pastDaysError(days, today);
    if (problem) {
      throw new OperationsAccessError(problem);
    }
    return this.gateway.addRouteTrips(organization.id, routeIds, days);
  }
}
