import { RouteProblem } from '../domain/transport-route';

export class RouteAccessError extends Error {
  constructor(readonly problem: RouteProblem) {
    super(problem);
    this.name = 'RouteAccessError';
  }
}
