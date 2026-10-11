import { SubscriptionPaymentProblem } from '../domain/subscription-payment';

export class SubscriptionPaymentError extends Error {
  constructor(readonly problem: SubscriptionPaymentProblem) {
    super(problem);
    this.name = 'SubscriptionPaymentError';
  }
}
