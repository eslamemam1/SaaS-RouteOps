import { VehicleProblem } from '../domain/vehicle';

export class VehicleAccessError extends Error {
  constructor(readonly problem: VehicleProblem) {
    super(problem);
    this.name = 'VehicleAccessError';
  }
}
