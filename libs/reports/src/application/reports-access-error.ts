import { ReportProblem } from '../domain/trip-report';

export class ReportsAccessError extends Error {
  constructor(readonly problem: ReportProblem) {
    super(problem);
    this.name = 'ReportsAccessError';
  }
}
