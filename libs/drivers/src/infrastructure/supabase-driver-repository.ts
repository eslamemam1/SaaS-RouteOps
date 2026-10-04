import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository } from '../application/driver-repository';
import {
  Driver,
  DriverDetails,
  DriverOrganization,
  memberOrganization,
} from '../domain/driver';
import { DriverGateway } from './driver-gateway';

export class SupabaseDriverRepository extends DriverRepository {
  constructor(private readonly gateway: DriverGateway) {
    super();
  }

  async organization(requestedId: string): Promise<DriverOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new DriverAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  list(organization: DriverOrganization): Promise<Driver[]> {
    return this.gateway.listDrivers(organization.id);
  }

  add(organization: DriverOrganization, details: DriverDetails): Promise<Driver> {
    return this.gateway.insertDriver(organization.id, details);
  }

  update(
    organization: DriverOrganization,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver> {
    return this.gateway.updateDriver(organization.id, driverId, details);
  }
}
