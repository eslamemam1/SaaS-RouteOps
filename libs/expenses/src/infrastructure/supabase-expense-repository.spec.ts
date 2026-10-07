import { ExpenseAccessError } from '../application/expense-access-error';
import { ExpenseOrganization } from '../domain/expense';
import { ExpenseGateway } from './expense-gateway';
import { SupabaseExpenseRepository } from './supabase-expense-repository';

const north: ExpenseOrganization = { id: 'org-north', name: 'North', currency: 'EGP' };

describe('SupabaseExpenseRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseExpenseRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    await expect(repository.organization('org-south')).resolves.toBeNull();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseExpenseRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new ExpenseAccessError('signedOut'),
    );
    expect(gateway.membershipOrganizations).not.toHaveBeenCalled();
  });

  it('loads the expenses, drivers pay, and vehicles pay of the whole month', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseExpenseRepository(gateway);

    await repository.month(north, '2026-02', '2026-02-10');

    const february = { from: '2026-02-01', to: '2026-02-28' };
    expect(gateway.listExpenses).toHaveBeenCalledWith('org-north', february);
    expect(gateway.driverPay).toHaveBeenCalledWith('org-north', february, '2026-02-10');
    expect(gateway.vehiclePay).toHaveBeenCalledWith('org-north', february, '2026-02-10');
  });

  it('removes an expense of the organization', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseExpenseRepository(gateway);

    await repository.remove(north, 'expense-1');

    expect(gateway.deleteExpense).toHaveBeenCalledWith('org-north', 'expense-1');
  });
});

function fakeGateway(
  userId: string | null,
  memberships: ExpenseOrganization[],
): ExpenseGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listChoices: vi.fn(async () => ({ vehicles: [], drivers: [] })),
    listExpenses: vi.fn(async () => []),
    driverPay: vi.fn(async () => []),
    vehiclePay: vi.fn(async () => []),
    insertExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(async () => undefined),
  };
}
