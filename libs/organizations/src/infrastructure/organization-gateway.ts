import { SupabaseClient } from '@supabase/supabase-js';
import {
  CompanyAccountProblem,
  isCompanyAccountProblem,
} from '../domain/company-account';
import { defaultCurrency, isCurrency } from '@routeops/shared/money';
import { DashboardFacts, DateRange } from '../domain/dashboard';
import { CompanyAccount, Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { ProvisionCompany } from '../application/organization-repository';
import { Database } from './database';

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
  dashboardFacts(
    organizationId: string,
    month: DateRange,
    today: string,
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
      logins: row.login_emails ?? [],
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
        },
      },
    );
    if (error) {
      throw new OrganizationAccessError(await safeFunctionProblem(error));
    }
  }

  // Salaries and monthly rents are due every month; pay for trips is due only
  // once there are done trips.
  async dashboardFacts(
    organizationId: string,
    month: DateRange,
    today: string,
  ): Promise<DashboardFacts> {
    const client = this.requireClient();
    const monthArgs = {
      p_organization_id: organizationId,
      p_from: month.from,
      p_to: month.to,
      p_today: today,
    };
    const [trips, todayCounts, monthCounts, expenses, unopened, drivers, vehicles] =
      await Promise.all([
        client
          .from('daily_trips')
          .select('is_cancelled')
          .eq('organization_id', organizationId)
          .eq('service_date', today),
        client.rpc('trip_report', { ...monthArgs, p_from: today, p_to: today }),
        client.rpc('trip_report', monthArgs),
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
        client.rpc('driver_pay', monthArgs),
        client.rpc('vehicle_pay', monthArgs),
      ]);
    if (
      trips.error ||
      todayCounts.error ||
      monthCounts.error ||
      expenses.error ||
      unopened.error ||
      drivers.error ||
      vehicles.error
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
      unrecordedDriverPay: (drivers.data ?? []).filter(
        (row) =>
          Number(row.recorded) === 0 &&
          (row.pay_type === 'salary' || row.done_outbound + row.done_return > 0),
      ).length,
      unrecordedVehiclePay: (vehicles.data ?? []).filter(
        (row) =>
          Number(row.recorded) === 0 &&
          (row.rent_type === 'monthly' || row.done_outbound + row.done_return > 0),
      ).length,
    };
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new OrganizationAccessError('notConnected');
    }
    return this.client;
  }
}

async function safeFunctionProblem(
  error: unknown,
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
  return 'create';
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
