import { SupabaseClient } from '@supabase/supabase-js';
import {
  Currency,
  defaultCurrency,
  isCurrency,
  toMinorUnits,
} from '@routeops/shared/money';
import { ExpenseAccessError } from '../application/expense-access-error';
import {
  DateRange,
  DriverPay,
  Expense,
  ExpenseChoices,
  ExpenseDetails,
  ExpenseOrganization,
  isExpenseCategory,
} from '../domain/expense';
import { Database } from './database';

export interface ExpenseGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<ExpenseOrganization[]>;
  listChoices(organizationId: string): Promise<ExpenseChoices>;
  listExpenses(organizationId: string, range: DateRange): Promise<Expense[]>;
  driverPay(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverPay[]>;
  insertExpense(
    organization: ExpenseOrganization,
    details: ExpenseDetails,
  ): Promise<Expense>;
  updateExpense(
    organization: ExpenseOrganization,
    expenseId: string,
    details: ExpenseDetails,
  ): Promise<Expense>;
  deleteExpense(organizationId: string, expenseId: string): Promise<void>;
}

type ExpenseRow = Pick<
  Database['public']['Tables']['expenses']['Row'],
  | 'id'
  | 'spent_on'
  | 'category'
  | 'amount'
  | 'vehicle_id'
  | 'driver_id'
  | 'description'
>;

const expenseColumns =
  'id, spent_on, category, amount, vehicle_id, driver_id, description';

export class SupabaseExpenseGateway implements ExpenseGateway {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  async membershipOrganizations(
    userId: string,
  ): Promise<ExpenseOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name, currency)')
      .eq('user_id', userId);
    if (error) {
      throw new ExpenseAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [
            {
              id: row.organizations.id,
              name: row.organizations.name,
              currency: isCurrency(row.organizations.currency)
                ? row.organizations.currency
                : defaultCurrency,
            },
          ]
        : [],
    );
  }

  async listChoices(organizationId: string): Promise<ExpenseChoices> {
    const client = this.requireClient();
    const [vehicles, drivers] = await Promise.all([
      client
        .from('vehicles')
        .select('id, plate_number, is_active')
        .eq('organization_id', organizationId)
        .order('plate_number'),
      client
        .from('drivers')
        .select('id, full_name, is_active')
        .eq('organization_id', organizationId)
        .order('full_name'),
    ]);
    if (vehicles.error || drivers.error) {
      throw new ExpenseAccessError('load');
    }
    return {
      vehicles: (vehicles.data ?? []).map((row) => ({
        id: row.id,
        label: row.plate_number,
        active: row.is_active,
      })),
      drivers: (drivers.data ?? []).map((row) => ({
        id: row.id,
        label: row.full_name,
        active: row.is_active,
      })),
    };
  }

  async listExpenses(
    organizationId: string,
    range: DateRange,
  ): Promise<Expense[]> {
    const { data, error } = await this.requireClient()
      .from('expenses')
      .select(expenseColumns)
      .eq('organization_id', organizationId)
      .gte('spent_on', range.from)
      .lte('spent_on', range.to)
      .order('spent_on', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      throw new ExpenseAccessError('load');
    }
    return (data ?? []).map(toExpense);
  }

  async driverPay(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<DriverPay[]> {
    const { data, error } = await this.requireClient().rpc('driver_pay', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
      p_today: today,
    });
    if (error) {
      throw new ExpenseAccessError('load');
    }
    return (data ?? []).map((row) => ({
      driverId: row.driver_id,
      doneTrips: row.done_trips,
      monthlySalary: row.monthly_salary === null ? null : Number(row.monthly_salary),
      tripPay: row.trip_pay === null ? null : Number(row.trip_pay),
      recorded: Number(row.recorded),
    }));
  }

  async insertExpense(
    organization: ExpenseOrganization,
    details: ExpenseDetails,
  ): Promise<Expense> {
    const { data, error } = await this.requireClient()
      .from('expenses')
      .insert({
        organization_id: organization.id,
        ...toColumns(details, organization.currency),
      })
      .select(expenseColumns)
      .single();
    if (error || !data) {
      throw new ExpenseAccessError('save');
    }
    return toExpense(data);
  }

  async updateExpense(
    organization: ExpenseOrganization,
    expenseId: string,
    details: ExpenseDetails,
  ): Promise<Expense> {
    const { data, error } = await this.requireClient()
      .from('expenses')
      .update(toColumns(details, organization.currency))
      .eq('id', expenseId)
      .eq('organization_id', organization.id)
      .select(expenseColumns)
      .single();
    if (error || !data) {
      throw new ExpenseAccessError('save');
    }
    return toExpense(data);
  }

  // Row level security hides a row the member may not delete, so no deleted
  // row means it was not removed.
  async deleteExpense(organizationId: string, expenseId: string): Promise<void> {
    const { data, error } = await this.requireClient()
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('organization_id', organizationId)
      .select('id');
    if (error || !data || data.length === 0) {
      throw new ExpenseAccessError('remove');
    }
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new ExpenseAccessError('notConnected');
    }
    return this.client;
  }
}

function toExpense(row: ExpenseRow): Expense {
  if (!isExpenseCategory(row.category)) {
    throw new ExpenseAccessError('load');
  }
  return {
    id: row.id,
    spentOn: row.spent_on,
    category: row.category,
    amount: Number(row.amount),
    vehicleId: row.vehicle_id ?? '',
    driverId: row.driver_id ?? '',
    description: row.description ?? '',
  };
}

function toColumns(details: ExpenseDetails, currency: Currency) {
  if (!isExpenseCategory(details.category)) {
    throw new ExpenseAccessError('category');
  }
  const amount = toMinorUnits(details.amount, currency);
  if (typeof amount !== 'number' || amount <= 0) {
    throw new ExpenseAccessError('amount');
  }
  return {
    spent_on: details.spentOn,
    category: details.category,
    amount,
    vehicle_id: blankToNull(details.vehicleId),
    driver_id: blankToNull(details.driverId),
    description: blankToNull(details.description),
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
