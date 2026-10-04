import { Signal } from '@angular/core';
import { OperationsProblem } from '../domain/daily-trip';

export type Problems = Signal<Record<OperationsProblem, string>>;

export function fieldError(problem: OperationsProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}
