import { VehicleAccessError } from '../application/vehicle-access-error';
import { VehicleRepository } from '../application/vehicle-repository';
import {
  memberOrganization,
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
} from '../domain/vehicle';
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
    return this.gateway.listVehicles(organization.id);
  }

  add(
    organization: VehicleOrganization,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    return this.gateway.insertVehicle(organization.id, details);
  }

  update(
    organization: VehicleOrganization,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle> {
    return this.gateway.updateVehicle(organization.id, vehicleId, details);
  }
}
