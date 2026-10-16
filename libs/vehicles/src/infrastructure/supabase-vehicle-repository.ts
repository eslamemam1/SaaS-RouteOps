import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository, VehicleWork } from '../application/vehicle-repository';
import {
  memberOrganization,
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
} from '../domain/vehicle';
import { daysSoFar, monthDays, VehicleMonth } from '../domain/vehicle-month';
import { VehicleGateway } from './vehicle-gateway';

export class SupabaseVehicleRepository extends VehicleRepository {
  constructor(private readonly gateway: VehicleGateway) {
    super();
  }

  async organization(requestedId: string): Promise<VehicleOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new VehicleAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  list(organization: VehicleOrganization): Promise<Vehicle[]> {
    return this.gateway.listVehicles(organization);
  }

  vehicle(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<Vehicle | null> {
    return this.gateway.findVehicle(organization, vehicleId);
  }

  async work(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<VehicleWork> {
    const [choices, routes] = await Promise.all([
      this.gateway.workChoices(organization.id),
      this.gateway.vehicleRoutes(organization.id, vehicleId),
    ]);
    return { choices, routes };
  }

  async month(
    organization: VehicleOrganization,
    vehicleId: string,
    month: string,
    today: string,
  ): Promise<VehicleMonth> {
    const range = monthDays(month);
    const soFar = daysSoFar(month, today);
    const [trips, rent, expenses, unopenedDays] = await Promise.all([
      this.gateway.tripLog(organization.id, vehicleId, range, today),
      this.gateway.vehiclePay(organization.id, vehicleId, range, today),
      this.gateway.vehicleExpenses(organization.id, vehicleId, range),
      soFar ? this.gateway.unopenedDays(organization.id, soFar) : [],
    ]);
    return { trips, rent, expenses, unopenedDays };
  }

  add(
    organization: VehicleOrganization,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    return this.gateway.insertVehicle(organization, details);
  }

  update(
    organization: VehicleOrganization,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    return this.gateway.updateVehicle(organization, vehicleId, details);
  }

  remove(
    organization: VehicleOrganization,
    vehicle: Vehicle,
  ): Promise<void> {
    return this.gateway.deleteVehicle(organization.id, vehicle.id);
  }
}
