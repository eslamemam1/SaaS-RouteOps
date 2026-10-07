import { SupabaseClient } from '@supabase/supabase-js';
import { defaultCurrency, isCurrency } from '@routeops/shared/money';
import { ReportsAccessError } from '../application/reports-access-error';
import {
  DateRange,
  ExpenseTotal,
  isVehicleOwnership,
  ReportChoices,
  ReportOrganization,
  TripCount,
  UnrecordedPay,
} from '../domain/trip-report';
import { Database } from './database';

export interface ReportsGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<ReportOrganization[]>;
  listChoices(organizationId: string): Promise<ReportChoices>;
  tripCounts(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<TripCount[]>;
  unopenedDays(organizationId: string, range: DateRange): Promise<string[]>;
  expenseTotals(
    organizationId: string,
    range: DateRange,
  ): Promise<ExpenseTotal[]>;
  unrecordedPay(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<UnrecordedPay>;
}

export class SupabaseReportsGateway implements ReportsGateway {
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
  ): Promise<ReportOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name, currency)')
      .eq('user_id', userId);
    if (error) {
      throw new ReportsAccessError('load');
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

  // Inactive records stay in the list, because past trips may still use them.
  async listChoices(organizationId: string): Promise<ReportChoices> {
    const client = this.requireClient();
    const [customers, routes, vehicles, drivers] = await Promise.all([
      client
        .from('customers')
        .select('id, name')
        .eq('organization_id', organizationId),
      client
        .from('routes')
        .select('id, name, customer_id')
        .eq('organization_id', organizationId),
      client
        .from('vehicles')
        .select('id, plate_number, ownership, owner_name')
        .eq('organization_id', organizationId),
      client
        .from('drivers')
        .select('id, full_name')
        .eq('organization_id', organizationId),
    ]);
    if (customers.error || routes.error || vehicles.error || drivers.error) {
      throw new ReportsAccessError('load');
    }
    return {
      customers: (customers.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
      })),
      routes: (routes.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        customerId: row.customer_id,
      })),
      vehicles: (vehicles.data ?? []).map((row) => {
        if (!isVehicleOwnership(row.ownership)) {
          throw new ReportsAccessError('load');
        }
        return {
          id: row.id,
          label: row.plate_number,
          ownership: row.ownership,
          ownerName: row.owner_name ?? '',
        };
      }),
      drivers: (drivers.data ?? []).map((row) => ({
        id: row.id,
        label: row.full_name,
      })),
    };
  }

  async tripCounts(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<TripCount[]> {
    const { data, error } = await this.requireClient().rpc('trip_report', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
      p_today: today,
    });
    if (error) {
      throw new ReportsAccessError('load');
    }
    return (data ?? []).map((row) => ({
      customerId: row.customer_id,
      routeId: row.route_id ?? '',
      vehicleId: row.vehicle_id ?? '',
      driverId: row.driver_id ?? '',
      done: row.done_trips,
      extra: row.extra_trips,
      revenue: Number(row.revenue),
      unpriced: row.unpriced_trips,
    }));
  }

  async unopenedDays(
    organizationId: string,
    range: DateRange,
  ): Promise<string[]> {
    const { data, error } = await this.requireClient().rpc('unopened_days', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
    });
    if (error) {
      throw new ReportsAccessError('load');
    }
    return data ?? [];
  }

  async expenseTotals(
    organizationId: string,
    range: DateRange,
  ): Promise<ExpenseTotal[]> {
    const { data, error } = await this.requireClient().rpc('expense_totals', {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
    });
    if (error) {
      throw new ReportsAccessError('load');
    }
    return (data ?? []).map((row) => ({
      category: row.category,
      vehicleId: row.vehicle_id ?? '',
      driverId: row.driver_id ?? '',
      total: Number(row.total),
    }));
  }

  // A salary is due every month and a monthly rent too; pay for trips is due
  // only once there are done trips.
  async unrecordedPay(
    organizationId: string,
    range: DateRange,
    today: string,
  ): Promise<UnrecordedPay> {
    const client = this.requireClient();
    const args = {
      p_organization_id: organizationId,
      p_from: range.from,
      p_to: range.to,
      p_today: today,
    };
    const [drivers, vehicles] = await Promise.all([
      client.rpc('driver_pay', args),
      client.rpc('vehicle_pay', args),
    ]);
    if (drivers.error || vehicles.error) {
      throw new ReportsAccessError('load');
    }
    return {
      drivers: (drivers.data ?? []).filter(
        (row) =>
          Number(row.recorded) === 0 &&
          (row.pay_type === 'salary' || row.done_outbound + row.done_return > 0),
      ).length,
      vehicles: (vehicles.data ?? []).filter(
        (row) =>
          Number(row.recorded) === 0 &&
          (row.rent_type === 'monthly' || row.done_outbound + row.done_return > 0),
      ).length,
    };
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new ReportsAccessError('notConnected');
    }
    return this.client;
  }
}
