import { Signal } from '@angular/core';
import { disabled, schema, validate } from '@angular/forms/signals';
import { Currency } from '@routeops/shared/money';
import {
  departureTimeError,
  driverError,
  extraCustomerError,
  ExtraTripDetails,
  notesError,
  tripPriceError,
} from '../domain/daily-trip';
import { fieldError, Problems } from './field-error';

export function extraTripSchema(problems: Problems, currency: Signal<Currency>) {
  return schema<ExtraTripDetails>((path) => {
    // A trip of a route belongs to the route's customer.
    disabled(path.customerId, ({ valueOf }) => valueOf(path.routeId) !== '');
    validate(path.customerId, ({ value }) =>
      fieldError(extraCustomerError(value()), problems),
    );
    validate(path.departureTime, ({ value }) =>
      fieldError(departureTimeError(value()), problems),
    );
    validate(path.driverId, ({ value }) =>
      fieldError(driverError(value()), problems),
    );
    validate(path.tripPrice, ({ value }) =>
      fieldError(tripPriceError(value(), currency()), problems),
    );
    validate(path.notes, ({ value }) =>
      fieldError(notesError(value(), ''), problems),
    );
  });
}
