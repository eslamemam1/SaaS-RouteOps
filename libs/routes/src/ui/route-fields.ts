import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import { Currency } from '@routeops/shared/money';
import {
  customerError,
  daysError,
  driverError,
  endPointError,
  optionalTextError,
  routeLimits,
  routeNameError,
  RouteProblem,
  startPointError,
  timeError,
  TransportRouteDetails,
  tripError,
  tripPriceError,
} from '../domain/transport-route';

type Problems = Signal<Record<RouteProblem, string>>;

function fieldError(problem: RouteProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function routeDetailsSchema(
  problems: Problems,
  currency: Signal<Currency>,
) {
  return schema<TransportRouteDetails>((path) => {
    validate(path.name, ({ value }) =>
      fieldError(routeNameError(value()), problems),
    );
    validate(path.customerId, ({ value }) =>
      fieldError(customerError(value()), problems),
    );
    validate(path.driverId, ({ value }) =>
      fieldError(driverError(value()), problems),
    );
    validate(path.startPoint, ({ value }) =>
      fieldError(startPointError(value()), problems),
    );
    validate(path.endPoint, ({ value }) =>
      fieldError(endPointError(value()), problems),
    );
    validate(path.outboundTime, ({ value, valueOf }) =>
      fieldError(
        timeError(value()) ?? tripError(value(), valueOf(path.returnTime)),
        problems,
      ),
    );
    validate(path.returnTime, ({ value }) =>
      fieldError(timeError(value()), problems),
    );
    validate(path.days, ({ value }) =>
      fieldError(daysError(value()), problems),
    );
    validate(path.tripPrice, ({ value }) =>
      fieldError(tripPriceError(value(), currency()), problems),
    );
    validate(path.notes, ({ value }) =>
      fieldError(optionalTextError(value(), routeLimits.notes), problems),
    );
  });
}
