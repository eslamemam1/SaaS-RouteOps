import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  customerEmailError,
  CustomerDetails,
  customerLimits,
  customerNameError,
  CustomerProblem,
  optionalTextError,
} from '../domain/customer';

type Problems = Signal<Record<CustomerProblem, string>>;

function fieldError(problem: CustomerProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function customerDetailsSchema(problems: Problems) {
  return schema<CustomerDetails>((path) => {
    validate(path.name, ({ value }) =>
      fieldError(customerNameError(value()), problems),
    );
    validate(path.contactName, ({ value }) =>
      fieldError(optionalTextError(value(), customerLimits.contactName), problems),
    );
    validate(path.phone, ({ value }) =>
      fieldError(optionalTextError(value(), customerLimits.phone), problems),
    );
    validate(path.email, ({ value }) =>
      fieldError(customerEmailError(value()), problems),
    );
    validate(path.address, ({ value }) =>
      fieldError(optionalTextError(value(), customerLimits.address), problems),
    );
    validate(path.notes, ({ value }) =>
      fieldError(optionalTextError(value(), customerLimits.notes), problems),
    );
  });
}
