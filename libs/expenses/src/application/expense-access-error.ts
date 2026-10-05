import { ExpenseProblem } from '../domain/expense';

export class ExpenseAccessError extends Error {
  constructor(readonly problem: ExpenseProblem) {
    super(problem);
    this.name = 'ExpenseAccessError';
  }
}
