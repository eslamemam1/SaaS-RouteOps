import { Driver, DriverDetails, DriverOrganization } from '../domain/driver';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class DriverRepository {
  abstract organization(requestedId: string): Promise<DriverOrganization | null>;
  abstract list(organization: DriverOrganization): Promise<Driver[]>;
  abstract add(
    organization: DriverOrganization,
    details: DriverDetails,
  ): Promise<Driver>;
  abstract update(
    organization: DriverOrganization,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver>;
}
