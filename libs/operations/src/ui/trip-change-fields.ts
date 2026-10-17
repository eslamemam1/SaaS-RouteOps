import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  DailyTrip,
  driverError,
  notesError,
  reasonError,
  TripChange,
  tripChangeNeedsReason,
} from '../domain/daily-trip';
import { fieldError, Problems } from './field-error';

export function tripChangeSchema(
  problems: Problems,
  baseline: Signal<DailyTrip>,
) {
  return schema<TripChange>((path) => {
    validate(path.driverId, ({ value }) =>
      fieldError(driverError(value()), problems),
    );
    validate(path.reason, ({ value, valueOf }) => {
      const change: TripChange = {
        vehicleId: valueOf(path.vehicleId),
        driverId: valueOf(path.driverId),
        cancelled: valueOf(path.cancelled),
        reason: value(),
        notes: valueOf(path.notes),
      };
      if (!tripChangeNeedsReason(change, baseline())) {
        return undefined;
      }
      return fieldError(reasonError(value()), problems);
    });
    validate(path.notes, ({ value, valueOf }) =>
      fieldError(notesError(value(), valueOf(path.reason)), problems),
    );
  });
}
