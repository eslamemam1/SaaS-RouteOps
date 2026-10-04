import {
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
} from '../domain/vehicle';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class VehicleRepository {
  abstract organization(requestedId: string): Promise<VehicleOrganization | null>;
  abstract list(organization: VehicleOrganization): Promise<Vehicle[]>;
  abstract add(
    organization: VehicleOrganization,
    details: VehicleDetails,
  ): Promise<Vehicle>;
  abstract update(
    organization: VehicleOrganization,
    vehicleId: string,
    details: VehicleDetails,
  ): Promise<Vehicle>;
}
