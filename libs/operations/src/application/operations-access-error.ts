import { OperationsProblem } from '../domain/daily-trip';

export class OperationsAccessError extends Error {
  constructor(readonly problem: OperationsProblem) {
    super(problem);
    this.name = 'OperationsAccessError';
  }
}
