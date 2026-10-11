import { Driver, DriverDetails, DriverOrganization } from '../domain/driver';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class DriverRepository {
  abstract organization(
    requestedId: string,
  ): Promise<DriverOrganization | null>;
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
  // photo is an already shrunk WebP or JPEG; it replaces the driver's photo.
  abstract setPhoto(
    organization: DriverOrganization,
    driver: Driver,
    photo: Blob,
  ): Promise<Driver>;
  abstract removePhoto(
    organization: DriverOrganization,
    driver: Driver,
  ): Promise<Driver>;
}
