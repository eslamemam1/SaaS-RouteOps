import { schema, validate } from '@angular/forms/signals';
import {
  emailError,
  organizationNameError,
  passwordError,
} from '../domain/company-account';

function fieldError(message: string | null) {
  return message === null ? undefined : { kind: 'invalid', message };
}

export const organizationNameField = schema<string>((path) => {
  validate(path, ({ value }) => fieldError(organizationNameError(value())));
});

export const emailField = schema<string>((path) => {
  validate(path, ({ value }) => fieldError(emailError(value())));
});

export const passwordField = schema<string>((path) => {
  validate(path, ({ value }) => fieldError(passwordError(value())));
});
