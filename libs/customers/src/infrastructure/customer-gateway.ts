import { SupabaseClient } from '@supabase/supabase-js';
import { CustomerAccessError } from '../application/customer-access-error';
import {
  Customer,
  CustomerDetails,
  CustomerOrganization,
} from '../domain/customer';
import { Database } from './database';

export interface CustomerGateway {
  sessionUserId(): Promise<string | null>;
  membershipOrganizations(userId: string): Promise<CustomerOrganization[]>;
  listCustomers(organizationId: string): Promise<Customer[]>;
  insertCustomer(
    organizationId: string,
    details: CustomerDetails,
  ): Promise<Customer>;
  updateCustomer(
    organizationId: string,
    customerId: string,
    details: CustomerDetails,
  ): Promise<Customer>;
}

type CustomerRow = Pick<
  Database['public']['Tables']['customers']['Row'],
  | 'id'
  | 'name'
  | 'contact_name'
  | 'phone'
  | 'email'
  | 'address'
  | 'notes'
  | 'is_active'
>;

const customerColumns =
  'id, name, contact_name, phone, email, address, notes, is_active';

export class SupabaseCustomerGateway implements CustomerGateway {
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
  ): Promise<CustomerOrganization[]> {
    const { data, error } = await this.requireClient()
      .from('organization_memberships')
      .select('organizations(id, name)')
      .eq('user_id', userId);
    if (error) {
      throw new CustomerAccessError('load');
    }
    return (data ?? []).flatMap((row) =>
      row.organizations
        ? [{ id: row.organizations.id, name: row.organizations.name }]
        : [],
    );
  }

  async listCustomers(organizationId: string): Promise<Customer[]> {
    const { data, error } = await this.requireClient()
      .from('customers')
      .select(customerColumns)
      .eq('organization_id', organizationId)
      .order('name');
    if (error) {
      throw new CustomerAccessError('load');
    }
    return (data ?? []).map(toCustomer);
  }

  async insertCustomer(
    organizationId: string,
    details: CustomerDetails,
  ): Promise<Customer> {
    const { data, error } = await this.requireClient()
      .from('customers')
      .insert({ organization_id: organizationId, ...toColumns(details) })
      .select(customerColumns)
      .single();
    if (error || !data) {
      throw new CustomerAccessError('save');
    }
    return toCustomer(data);
  }

  async updateCustomer(
    organizationId: string,
    customerId: string,
    details: CustomerDetails,
  ): Promise<Customer> {
    const { data, error } = await this.requireClient()
      .from('customers')
      .update(toColumns(details))
      .eq('id', customerId)
      .eq('organization_id', organizationId)
      .select(customerColumns)
      .single();
    if (error || !data) {
      throw new CustomerAccessError('save');
    }
    return toCustomer(data);
  }

  private requireClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new CustomerAccessError('notConnected');
    }
    return this.client;
  }
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    notes: row.notes ?? '',
    active: row.is_active,
  };
}

function toColumns(details: CustomerDetails) {
  return {
    name: details.name.trim(),
    contact_name: blankToNull(details.contactName),
    phone: blankToNull(details.phone),
    email: blankToNull(details.email),
    address: blankToNull(details.address),
    notes: blankToNull(details.notes),
    is_active: details.active,
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
