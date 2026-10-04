import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import {
  CompanyAccountProblem,
  emailError,
  organizationNameError,
  passwordError,
} from '../domain/company-account';
import { OrganizationsText } from './organizations-text';

type Problems = Signal<OrganizationsText['problems']>;

function fieldError(problem: CompanyAccountProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function organizationNameField(problems: Problems) {
  return schema<string>((path) => {
    validate(path, ({ value }) =>
      fieldError(organizationNameError(value()), problems),
    );
  });
}

export function emailField(problems: Problems) {
  return schema<string>((path) => {
    validate(path, ({ value }) => fieldError(emailError(value()), problems));
  });
}

export function passwordField(problems: Problems) {
  return schema<string>((path) => {
    validate(path, ({ value }) => fieldError(passwordError(value()), problems));
  });
}
