import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  dateError,
  DriverDetails,
  driverLimits,
  driverNameError,
  DriverProblem,
  nationalIdError,
  optionalTextError,
} from '../domain/driver';

type Problems = Signal<Record<DriverProblem, string>>;

function fieldError(problem: DriverProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function driverDetailsSchema(problems: Problems) {
  return schema<DriverDetails>((path) => {
    validate(path.fullName, ({ value }) =>
      fieldError(driverNameError(value()), problems),
    );
    validate(path.phone, ({ value }) =>
      fieldError(optionalTextError(value(), driverLimits.phone), problems),
    );
    validate(path.nationalId, ({ value }) =>
      fieldError(nationalIdError(value()), problems),
    );
    validate(path.licenseNumber, ({ value }) =>
      fieldError(
        optionalTextError(value(), driverLimits.licenseNumber),
        problems,
      ),
    );
    validate(path.licenseExpiry, ({ value }) =>
      fieldError(dateError(value()), problems),
    );
    validate(path.notes, ({ value }) =>
      fieldError(optionalTextError(value(), driverLimits.notes), problems),
    );
  });
}
