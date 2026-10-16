import { VehicleProblem } from '../domain/vehicle';

export class VehicleAccessError extends Error {
  // routes names the routes that stop a change, for activeRoutes and inUse.
  constructor(
    readonly problem: VehicleProblem,
    readonly routes: readonly string[] = [],
  ) {
    super(problem);
    this.name = 'VehicleAccessError';
  }
}
