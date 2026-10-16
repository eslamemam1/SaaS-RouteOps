import { Driver, DriverDetails, DriverOrganization } from '../domain/driver';
import { DriverMonth, DriverRoute, WorkChoices } from '../domain/driver-month';

// The names a driver's page shows, and the active routes the driver drives.
export interface DriverWork {
  readonly choices: WorkChoices;
  readonly routes: readonly DriverRoute[];
}

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class DriverRepository {
  abstract organization(
    requestedId: string,
  ): Promise<DriverOrganization | null>;
  abstract list(organization: DriverOrganization): Promise<Driver[]>;
  // null when the organization has no such driver.
  abstract driver(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<Driver | null>;
  abstract work(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<DriverWork>;
  // month is YYYY-MM; today is the member's local date, and a trip whose day
  // comes later never counts.
  abstract month(
    organization: DriverOrganization,
    driverId: string,
    month: string,
    today: string,
  ): Promise<DriverMonth>;
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
  abstract remove(
    organization: DriverOrganization,
    driver: Driver,
  ): Promise<void>;
}
