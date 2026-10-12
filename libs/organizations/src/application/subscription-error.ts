import { SubscriptionProblem } from '../domain/subscription';

export class SubscriptionError extends Error {
  constructor(readonly problem: SubscriptionProblem) {
    super(problem);
    this.name = 'SubscriptionError';
  }
}
