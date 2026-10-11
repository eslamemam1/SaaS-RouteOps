import { DriverProblem } from '../domain/driver';

export class DriverAccessError extends Error {
  // routes names the active routes that stop a change, for activeRoutes.
  constructor(
    readonly problem: DriverProblem,
    readonly routes: readonly string[] = [],
  ) {
    super(problem);
    this.name = 'DriverAccessError';
  }
}
