import { OperationsAccessError } from '../application/operations-access-error';
import { OperationsRepository } from '../application/operations-repository';
import {
  DailyTrip,
  isServiceDate,
  memberOrganization,
  OperationChoices,
  OperationsOrganization,
  TripChange,
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

  choices(organization: OperationsOrganization): Promise<OperationChoices> {
    return this.gateway.listChoices(organization.id);
  }

  changeTrip(
    organization: OperationsOrganization,
    tripId: string,
    change: TripChange,
  ): Promise<DailyTrip> {
    return this.gateway.updateTrip(organization.id, tripId, change);
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
}
