import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  customerError,
  daysError,
  endPointError,
  optionalTextError,
  routeLimits,
  routeNameError,
  RouteProblem,
  startPointError,
  timeError,
  TransportRouteDetails,
  tripError,
} from '../domain/transport-route';

type Problems = Signal<Record<RouteProblem, string>>;

function fieldError(problem: RouteProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function routeDetailsSchema(problems: Problems) {
  return schema<TransportRouteDetails>((path) => {
    validate(path.name, ({ value }) =>
      fieldError(routeNameError(value()), problems),
    );
    validate(path.customerId, ({ value }) =>
      fieldError(customerError(value()), problems),
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
    validate(path.notes, ({ value }) =>
      fieldError(optionalTextError(value(), routeLimits.notes), problems),
    );
  });
}
