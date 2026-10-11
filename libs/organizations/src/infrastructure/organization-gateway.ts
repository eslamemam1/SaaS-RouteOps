import {
  remainingPay,
  remainingRent,
  toDriverPay,
  toVehiclePay,
} from '@routeops/shared/pay';
import { allRows } from '@routeops/shared/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CompanyAccountProblem,
  isCompanyAccountProblem,
} from '../domain/company-account';
import { defaultCurrency, isCurrency } from '@routeops/shared/money';
import { DashboardFacts, DateRange } from '../domain/dashboard';
import { CompanyAccount, Organization } from '../domain/organization';
import { SubscriptionPayment } from '../domain/subscription-payment';
import { OrganizationAccessError } from '../application/organization-access-error';
import { ProvisionCompany } from '../application/organization-repository';
import { SubscriptionPaymentError } from '../application/subscription-payment-error';
import { Database } from './database';

// amount is in the smallest unit of the company's currency, and coversMonth
// is a month such as "2026-10".
export interface NewSubscriptionPayment {
  readonly organizationId: string;
  readonly paidOn: string;
  readonly coversMonth: string;
  readonly amount: number;
  readonly note: string;
}

type PaymentRow = Database['public']['Tables']['subscription_payments']['Row'];
const paymentColumns = 'id, organization_id, paid_on, covers_month, amount, note';

export interface OrganizationGateway {
  isConfigured(): boolean;
  sessionUserId(): Promise<string | null>;
  membershipOrganizationIds(userId: string): Promise<string[]>;
  organizationsByIds(ids: readonly string[]): Promise<Organization[]>;
  isOperator(userId: string): Promise<boolean>;
  companyAccounts(): Promise<CompanyAccount[]>;
  setOrganizationActive(organizationId: string, isActive: boolean): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  provision(input: ProvisionCompany): Promise<void>;
  setLoginPassword(loginId: string, password: string): Promise<void>;
  subscriptionPayments(): Promise<SubscriptionPayment[]>;
  insertSubscriptionPayment(
    payment: NewSubscriptionPayment,
  ): Promise<SubscriptionPayment>;
  deleteSubscriptionPayment(paymentId: string): Promise<void>;
  dashboardFacts(
    organizationId: string,
    month: DateRange,
    today: string,
    payMonth: DateRange,
  ): Promise<DashboardFacts>;
}

export class SupabaseOrganizationGateway implements OrganizationGateway {
  constructor(private readonly client: SupabaseClient<Database> | null) {}

  isConfigured(): boolean {
    return this.client !== null;
  }

  async sessionUserId(): Promise<string | null> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  async membershipOrganizationIds(userId: string): Promise<string[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId);
    if (error) {
      throw new OrganizationAccessError('load');
    }
    return (data ?? []).map((row) => row.organization_id);
  }

  async organizationsByIds(ids: readonly string[]): Promise<Organization[]> {
    const { data, error } = await this.requireClient()
      .from('organizations')
      .select('id, name, currency, is_active')
      .in('id', [...ids]);
    if (error) {
      throw new OrganizationAccessError('load');
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      currency: isCurrency(row.currency) ? row.currency : defaultCurrency,
      isActive: row.is_active,
    }));
  }

  async isOperator(userId: string): Promise<boolean> {
    const { data, error } = await this.requireClient()
      .from('platform_operators')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      throw new OrganizationAccessError('load');
    }
    return data !== null;
  }

  async companyAccounts(): Promise<CompanyAccount[]> {
    const { data, error } = await this.requireClient().rpc('operator_accounts');
    if (error) {
      throw new OrganizationAccessError('load');
    }
    return (data ?? []).map((row) => ({
      id: row.organization_id,
      name: row.organization_name,
      currency: isCurrency(row.currency) ? row.currency : defaultCurrency,
      isActive: row.is_active,
      logins: (row.login_emails ?? []).map((email, index) => ({
        id: row.login_ids?.[index] ?? '',
        email,
      })),
      createdAt: row.created_at,
      lastSignInAt: row.last_sign_in_at,
    }));
  }

  async setOrganizationActive(
    organizationId: string,
    isActive: boolean,
  ): Promise<void> {
    const { error } = await this.requireClient().rpc('set_organization_active', {
      p_organization_id: organizationId,
      p_is_active: isActive,
    });
    if (error) {
      throw new OrganizationAccessError('accountStatus');
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.requireClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new OrganizationAccessError('signIn');
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.requireClient().auth.signOut();
    if (error) {
      throw new OrganizationAccessError('signOut');
    }
  }

  async provision(input: ProvisionCompany): Promise<void> {
    const { error } = await this.requireClient().functions.invoke(
      'provision-company',
      {
        body: {
          organizationName: input.organizationName.trim(),
          email: input.email.trim(),
          password: input.password,
          currency: input.currency,
          timeZone: input.timeZone,
        },
      },
    );
    if (error) {
      throw new OrganizationAccessError(await safeFunctionProblem(error, 'create'));
    }
  }

  async setLoginPassword(loginId: string, password: string): Promise<void> {
    const { error } = await this.requireClient().functions.invoke(
      'set-company-password',
      { body: { loginId, password } },
    );
    if (error) {
      throw new OrganizationAccessError(
        await safeFunctionProblem(error, 'passwordChange'),
      );
    }
  }

  async subscriptionPayments(): Promise<SubscriptionPayment[]> {
    const { data, error } = await this.paymentClient()
      .from('subscription_payments')
      .select(paymentColumns)
      .order('paid_on', { ascending: false });
    if (error) {
      throw new SubscriptionPaymentError('load');
    }
    return (data ?? []).map(toPayment);
  }

  async insertSubscriptionPayment(
    payment: NewSubscriptionPayment,
  ): Promise<SubscriptionPayment> {
    const { data, error } = await this.paymentClient()
      .from('subscription_payments')
      .insert({
        organization_id: payment.organizationId,
        paid_on: payment.paidOn,
        covers_month: `${payment.coversMonth}-01`,
        amount: payment.amount,
        note: payment.note.trim() || null,
      })
      .select(paymentColumns)
      .single();
    if (error || !data) {
      throw new SubscriptionPaymentError('save');
    }
    return toPayment(data);
  }

  async deleteSubscriptionPayment(paymentId: string): Promise<void> {
    const { data, error } = await this.paymentClient()
      .from('subscription_payments')
      .delete()
      .eq('id', paymentId)
      .select('id');
    if (error || (data ?? []).length === 0) {
      throw new SubscriptionPaymentError('remove');
    }
  }

  // Pay is checked for payMonth, the month before, under the same rule as the
  // expenses screen.
  async dashboardFacts(
    organizationId: string,
    month: DateRange,
    today: string,
    payMonth: DateRange,
  ): Promise<DashboardFacts> {
    const client = this.requireClient();
    const monthArgs = {
      p_organization_id: organizationId,
      p_from: month.from,
      p_to: month.to,
      p_today: today,
    };
    const payArgs = { ...monthArgs, p_from: payMonth.from, p_to: payMonth.to };
    const count = (table: 'customers' | 'drivers' | 'routes') =>
      client
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
    const [
      trips,
      todayCounts,
      monthCounts,
      expenses,
      unopened,
      drivers,
      vehicles,
      customerCount,
      driverCount,
      routeCount,
    ] = await Promise.all([
        client
          .from('daily_trips')
          .select('is_cancelled')
          .eq('organization_id', organizationId)
          .eq('service_date', today),
        client.rpc('trip_report', { ...monthArgs, p_from: today, p_to: today }),
        allRows((from, to) =>
          client
            .rpc('trip_report', monthArgs)
            .order('customer_id')
            .order('route_id')
            .order('vehicle_id')
            .order('driver_id')
            .order('direction')
            .range(from, to),
        ),
        client.rpc('expense_totals', {
          p_organization_id: organizationId,
          p_from: month.from,
          p_to: month.to,
        }),
        client.rpc('unopened_days', {
          p_organization_id: organizationId,
          p_from: month.from,
          p_to: today,
        }),
        client.rpc('driver_pay', payArgs),
        client.rpc('vehicle_pay', payArgs),
        count('customers'),
        count('drivers'),
        count('routes'),
      ]);
    if (
      trips.error ||
      todayCounts.error ||
      monthCounts.error ||
      expenses.error ||
      unopened.error ||
      drivers.error ||
      vehicles.error ||
      customerCount.error ||
      driverCount.error ||
      routeCount.error
    ) {
      throw new OrganizationAccessError('load');
    }
    const counts = monthCounts.data ?? [];
    return {
      todayTrips: (trips.data ?? []).map((row) => ({ cancelled: row.is_cancelled })),
      todayDone: sum((todayCounts.data ?? []).map((row) => row.done_trips)),
      monthDone: sum(counts.map((row) => row.done_trips)),
      monthRevenue: sum(counts.map((row) => Number(row.revenue))),
      monthUnpriced: sum(counts.map((row) => row.unpriced_trips)),
      monthExpenses: sum((expenses.data ?? []).map((row) => Number(row.total))),
      unopenedDays: unopened.data ?? [],
      unrecordedDriverPay: (drivers.data ?? []).filter((row) => {
        const pay = toDriverPay(row);
        return pay !== null && remainingPay(pay) > 0;
      }).length,
      unrecordedVehiclePay: (vehicles.data ?? []).filter((row) => {
        const rent = toVehiclePay(row);
        return rent !== null && remainingRent(rent) > 0;
      }).length,
      setup: {
        customers: customerCount.count ?? 0,
        drivers: driverCount.count ?? 0,
        routes: routeCount.count ?? 0,
      },
    };
  }

  private paymentClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new SubscriptionPaymentError('load');
    }
    return this.client;
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new OrganizationAccessError('notConnected');
    }
    return this.client;
  }
}

function toPayment(row: PaymentRow): SubscriptionPayment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    paidOn: row.paid_on,
    coversMonth: row.covers_month.slice(0, 7),
    amount: Number(row.amount),
    note: row.note ?? '',
  };
}

async function safeFunctionProblem(
  error: unknown,
  fallback: CompanyAccountProblem,
): Promise<CompanyAccountProblem> {
  const context = (error as { context?: Response }).context;
  if (context instanceof Response) {
    const body = (await context.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    if (isCompanyAccountProblem(body?.error)) {
      return body.error;
    }
  }
  return fallback;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
