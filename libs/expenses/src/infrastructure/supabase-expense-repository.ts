import { ExpenseAccessError } from '../application/expense-access-error';
import { ExpenseRepository } from '../application/expense-repository';
import {
  Expense,
  ExpenseChoices,
  ExpenseDetails,
  ExpenseMonth,
  ExpenseOrganization,
  memberOrganization,
  monthDays,
} from '../domain/expense';
import { ExpenseGateway } from './expense-gateway';

export class SupabaseExpenseRepository extends ExpenseRepository {
  constructor(private readonly gateway: ExpenseGateway) {
    super();
  }

  async organization(requestedId: string): Promise<ExpenseOrganization | null> {
    const userId = await this.gateway.sessionUserId();
    if (!userId) {
      throw new ExpenseAccessError('signedOut');
    }
    const memberships = await this.gateway.membershipOrganizations(userId);
    return memberOrganization(memberships, requestedId);
  }

  choices(organization: ExpenseOrganization): Promise<ExpenseChoices> {
    return this.gateway.listChoices(organization.id);
  }

  async month(
    organization: ExpenseOrganization,
    month: string,
    today: string,
  ): Promise<ExpenseMonth> {
    const range = monthDays(month);
    const [expenses, pay] = await Promise.all([
      this.gateway.listExpenses(organization.id, range),
      this.gateway.driverPay(organization.id, range, today),
    ]);
    return { expenses, pay };
  }

  add(
    organization: ExpenseOrganization,
    details: ExpenseDetails,
  ): Promise<Expense> {
    return this.gateway.insertExpense(organization, details);
  }

  update(
    organization: ExpenseOrganization,
    expenseId: string,
    details: ExpenseDetails,
  ): Promise<Expense> {
    return this.gateway.updateExpense(organization, expenseId, details);
  }

  remove(organization: ExpenseOrganization, expenseId: string): Promise<void> {
    return this.gateway.deleteExpense(organization.id, expenseId);
  }
}
