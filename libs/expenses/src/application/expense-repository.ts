import {
  Expense,
  ExpenseChoices,
  ExpenseDetails,
  ExpenseMonth,
  ExpenseOrganization,
} from '../domain/expense';

// Pass only an organization returned by organization(), which comes from the
// signed-in user's memberships.
export abstract class ExpenseRepository {
  abstract organization(requestedId: string): Promise<ExpenseOrganization | null>;
  abstract choices(organization: ExpenseOrganization): Promise<ExpenseChoices>;
  // today is the member's local date; a trip whose day comes later never counts
  // towards a driver's pay.
  abstract month(
    organization: ExpenseOrganization,
    month: string,
    today: string,
  ): Promise<ExpenseMonth>;
  abstract add(
    organization: ExpenseOrganization,
    details: ExpenseDetails,
  ): Promise<Expense>;
  abstract update(
    organization: ExpenseOrganization,
    expenseId: string,
    details: ExpenseDetails,
  ): Promise<Expense>;
  abstract remove(
    organization: ExpenseOrganization,
    expenseId: string,
  ): Promise<void>;
}
