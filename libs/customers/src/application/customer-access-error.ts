import { CustomerProblem } from '../domain/customer';

export class CustomerAccessError extends Error {
  constructor(readonly problem: CustomerProblem) {
    super(problem);
    this.name = 'CustomerAccessError';
  }
}
