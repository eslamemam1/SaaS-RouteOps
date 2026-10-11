import {
  Vehicle,
  VehicleDetails,
  VehicleOrganization,
} from '../domain/vehicle';
import { VehicleMonth, VehicleRoute, WorkChoices } from '../domain/vehicle-month';

// The names a vehicle's page shows, and the active routes the vehicle runs.
export interface VehicleWork {
  readonly choices: WorkChoices;
  readonly routes: readonly VehicleRoute[];
}

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class VehicleRepository {
  abstract organization(requestedId: string): Promise<VehicleOrganization | null>;
  abstract list(organization: VehicleOrganization): Promise<Vehicle[]>;
  // null when the organization has no such vehicle.
  abstract vehicle(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<Vehicle | null>;
  abstract work(
    organization: VehicleOrganization,
    vehicleId: string,
  ): Promise<VehicleWork>;
  // month is YYYY-MM; today is the member's local date, and a trip whose day
  // comes later never counts.
  abstract month(
    organization: VehicleOrganization,
    vehicleId: string,
    month: string,
    today: string,
  ): Promise<VehicleMonth>;
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
