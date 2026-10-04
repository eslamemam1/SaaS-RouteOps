import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  dateError,
  optionalTextError,
  ownerNameError,
  plateError,
  seatsError,
  VehicleDetails,
  vehicleLimits,
  VehicleProblem,
  vehicleTypeError,
  yearError,
} from '../domain/vehicle';

type Problems = Signal<Record<VehicleProblem, string>>;

function fieldError(problem: VehicleProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function vehicleDetailsSchema(problems: Problems, currentYear: number) {
  return schema<VehicleDetails>((path) => {
    validate(path.plateNumber, ({ value }) =>
      fieldError(plateError(value()), problems),
    );
    validate(path.type, ({ value }) =>
      fieldError(vehicleTypeError(value()), problems),
    );
    validate(path.model, ({ value }) =>
      fieldError(optionalTextError(value(), vehicleLimits.model), problems),
    );
    validate(path.year, ({ value }) =>
      fieldError(yearError(value(), currentYear), problems),
    );
    validate(path.seats, ({ value }) =>
      fieldError(seatsError(value()), problems),
    );
    validate(path.licenseExpiry, ({ value }) =>
      fieldError(dateError(value()), problems),
    );
    validate(path.ownerName, ({ value, valueOf }) =>
      fieldError(ownerNameError(value(), valueOf(path.ownership)), problems),
    );
    validate(path.ownerPhone, ({ value }) =>
      fieldError(optionalTextError(value(), vehicleLimits.ownerPhone), problems),
    );
    validate(path.notes, ({ value }) =>
      fieldError(optionalTextError(value(), vehicleLimits.notes), problems),
    );
  });
}
