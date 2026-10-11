import { DriverAccessError } from '../application/driver-access-error';
import { DriverRepository, DriverWork } from '../application/driver-repository';
import {
  Driver,
  DriverDetails,
  DriverOrganization,
  memberOrganization,
} from '../domain/driver';
import { daysSoFar, DriverMonth, monthDays } from '../domain/driver-month';
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
    return this.gateway.listDrivers(organization);
  }

  driver(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<Driver | null> {
    return this.gateway.findDriver(organization, driverId);
  }

  async work(
    organization: DriverOrganization,
    driverId: string,
  ): Promise<DriverWork> {
    const [choices, routes] = await Promise.all([
      this.gateway.workChoices(organization.id),
      this.gateway.driverRoutes(organization.id, driverId),
    ]);
    return { choices, routes };
  }

  async month(
    organization: DriverOrganization,
    driverId: string,
    month: string,
    today: string,
  ): Promise<DriverMonth> {
    const range = monthDays(month);
    const soFar = daysSoFar(month, today);
    const [trips, pay, unopenedDays] = await Promise.all([
      this.gateway.tripLog(organization.id, driverId, range, today),
      this.gateway.driverPay(organization.id, driverId, range, today),
      soFar ? this.gateway.unopenedDays(organization.id, soFar) : [],
    ]);
    return { trips, pay, unopenedDays };
  }

  add(
    organization: DriverOrganization,
    details: DriverDetails,
  ): Promise<Driver> {
    return this.gateway.insertDriver(organization, details);
  }

  update(
    organization: DriverOrganization,
    driverId: string,
    details: DriverDetails,
  ): Promise<Driver> {
    return this.gateway.updateDriver(organization, driverId, details);
  }

  // A new photo gets a new name, so no browser shows a cached old photo; the
  // old file is deleted once the driver points at the new one.
  async setPhoto(
    organization: DriverOrganization,
    driver: Driver,
    photo: Blob,
  ): Promise<Driver> {
    const extension = photo.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${organization.id}/${driver.id}/${crypto.randomUUID()}.${extension}`;
    await this.gateway.uploadPhoto(path, photo);
    let saved: Driver;
    try {
      saved = await this.gateway.setPhotoPath(organization, driver.id, path);
    } catch (error) {
      await this.gateway.deletePhoto(path);
      throw error;
    }
    if (driver.photo) {
      await this.gateway.deletePhoto(driver.photo.path);
    }
    return saved;
  }

  async removePhoto(
    organization: DriverOrganization,
    driver: Driver,
  ): Promise<Driver> {
    const saved = await this.gateway.setPhotoPath(
      organization,
      driver.id,
      null,
    );
    if (driver.photo) {
      await this.gateway.deletePhoto(driver.photo.path);
    }
    return saved;
  }
}
