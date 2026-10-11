import { VehicleProblem } from '../domain/vehicle';

export class VehicleAccessError extends Error {
  // routes names the active routes that stop a change, for activeRoutes.
  constructor(
    readonly problem: VehicleProblem,
    readonly routes: readonly string[] = [],
  ) {
    super(problem);
    this.name = 'VehicleAccessError';
  }
}
