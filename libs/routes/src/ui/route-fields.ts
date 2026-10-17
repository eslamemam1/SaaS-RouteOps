import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import { Currency } from '@routeops/shared/money';
import {
  arrivalError,
  customerError,
  daysError,
  driverError,
  endPointError,
  emptyTransportRouteDetails,
  optionalTextError,
  percentError,
  routeLimits,
  routeNameError,
  RouteProblem,
  splitAmountError,
  splitError,
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

// The split is checked only while the chosen vehicle is company-owned, since
// any other route is saved without one.
export function routeDetailsSchema(
  problems: Problems,
  currency: Signal<Currency>,
  splitOn: Signal<boolean>,
) {
  return schema<TransportRouteDetails>((path) => {
    validate(path.managementPercent, ({ value, valueOf }) =>
      splitOn() && valueOf(path.managementMode) === 'percent'
        ? fieldError(percentError(value()), problems)
        : undefined,
    );
    validate(path.managementAmount, ({ value, valueOf }) =>
      splitOn() && valueOf(path.managementMode) === 'amount'
        ? fieldError(splitAmountError(value(), currency()), problems)
        : undefined,
    );
    validate(path.vehicleSharePercent, ({ value, valueOf }) =>
      splitOn() && valueOf(path.vehicleShareMode) === 'percent'
        ? fieldError(percentError(value()), problems)
        : undefined,
    );
    validate(path.vehicleShareAmount, ({ value, valueOf }) =>
      splitOn() && valueOf(path.vehicleShareMode) === 'amount'
        ? fieldError(splitAmountError(value(), currency()), problems)
        : undefined,
    );
    validate(path.vehicleShareMode, ({ value, valueOf }) =>
      splitOn()
        ? fieldError(
            splitError(
              {
                ...emptyTransportRouteDetails,
                tripPrice: valueOf(path.tripPrice),
                managementMode: valueOf(path.managementMode),
                managementPercent: valueOf(path.managementPercent),
                managementAmount: valueOf(path.managementAmount),
                vehicleShareMode: value(),
                vehicleSharePercent: valueOf(path.vehicleSharePercent),
                vehicleShareAmount: valueOf(path.vehicleShareAmount),
              },
              currency(),
            ),
            problems,
          )
        : undefined,
    );
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
    validate(path.outboundArrivalTime, ({ value, valueOf }) =>
      fieldError(arrivalError(valueOf(path.outboundTime), value()), problems),
    );
    validate(path.returnTime, ({ value }) =>
      fieldError(timeError(value()), problems),
    );
    validate(path.returnArrivalTime, ({ value, valueOf }) =>
      fieldError(arrivalError(valueOf(path.returnTime), value()), problems),
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
