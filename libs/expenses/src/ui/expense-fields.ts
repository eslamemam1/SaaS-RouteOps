import { Signal } from '@angular/core';
import { schema, validate } from '@angular/forms/signals';
import { Currency } from '@routeops/shared/money';
import {
  categoryError,
  descriptionError,
  expenseAmountError,
  ExpenseDetails,
  ExpenseProblem,
  spentOnError,
} from '../domain/expense';

type Problems = Signal<Record<ExpenseProblem, string>>;

function fieldError(problem: ExpenseProblem | null, problems: Problems) {
  return problem === null
    ? undefined
    : { kind: problem, message: problems()[problem] };
}

export function expenseDetailsSchema(
  problems: Problems,
  currency: Signal<Currency>,
) {
  return schema<ExpenseDetails>((path) => {
    validate(path.spentOn, ({ value }) =>
      fieldError(spentOnError(value()), problems),
    );
    validate(path.category, ({ value }) =>
      fieldError(categoryError(value()), problems),
    );
    validate(path.amount, ({ value }) =>
      fieldError(expenseAmountError(value(), currency()), problems),
    );
    validate(path.description, ({ value, valueOf }) =>
      fieldError(descriptionError(value(), valueOf(path.category)), problems),
    );
  });
}
