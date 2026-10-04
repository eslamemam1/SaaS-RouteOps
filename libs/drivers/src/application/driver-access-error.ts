import { DriverProblem } from '../domain/driver';

export class DriverAccessError extends Error {
  constructor(readonly problem: DriverProblem) {
    super(problem);
    this.name = 'DriverAccessError';
  }
}
