import { CustomerProblem } from '../domain/customer';

export class CustomerAccessError extends Error {
  // routes names the active routes that stop a change, for activeRoutes.
  constructor(
    readonly problem: CustomerProblem,
    readonly routes: readonly string[] = [],
  ) {
    super(problem);
    this.name = 'CustomerAccessError';
  }
}
