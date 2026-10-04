import { schema, validate } from '@angular/forms/signals';
import { notesError, reasonError, TripChange } from '../domain/daily-trip';
import { fieldError, Problems } from './field-error';

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
