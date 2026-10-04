import { schema, validate } from '@angular/forms/signals';
import {
  customerEmailError,
  CustomerDetails,
  customerLimits,
  customerNameError,
  optionalTextError,
} from '../domain/customer';

function fieldError(message: string | null) {
  return message === null ? undefined : { kind: 'invalid', message };
}

export const customerDetailsSchema = schema<CustomerDetails>((path) => {
  validate(path.name, ({ value }) => fieldError(customerNameError(value())));
  validate(path.contactName, ({ value }) =>
    fieldError(optionalTextError(value(), customerLimits.contactName)),
  );
  validate(path.phone, ({ value }) =>
    fieldError(optionalTextError(value(), customerLimits.phone)),
  );
  validate(path.email, ({ value }) => fieldError(customerEmailError(value())));
  validate(path.address, ({ value }) =>
    fieldError(optionalTextError(value(), customerLimits.address)),
  );
  validate(path.notes, ({ value }) =>
    fieldError(optionalTextError(value(), customerLimits.notes)),
  );
});
