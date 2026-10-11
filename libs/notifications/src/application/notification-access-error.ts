export type NotificationProblem = 'load' | 'notConnected';

export class NotificationAccessError extends Error {
  constructor(readonly problem: NotificationProblem) {
    super(problem);
    this.name = 'NotificationAccessError';
  }
}
