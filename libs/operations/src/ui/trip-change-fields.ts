import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  notesError,
  OperationsProblem,
  reasonError,
  TripChange,
} from '../domain/daily-trip';

type Problems = Signal<Record<OperationsProblem, string>>;

function fieldError(problem: OperationsProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function tripChangeSchema(problems: Problems) {
  return schema<TripChange>((path) => {
    validate(path.reason, ({ value }) =>
      fieldError(reasonError(value()), problems),
    );
    validate(path.notes, ({ value, valueOf }) =>
      fieldError(notesError(value(), valueOf(path.reason)), problems),
    );
  });
}
