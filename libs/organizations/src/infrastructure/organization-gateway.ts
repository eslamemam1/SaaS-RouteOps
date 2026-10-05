import { SupabaseClient } from '@supabase/supabase-js';
import {
  CompanyAccountProblem,
  isCompanyAccountProblem,
} from '../domain/company-account';
import { Organization } from '../domain/organization';
import { OrganizationAccessError } from '../application/organization-access-error';
import { ProvisionCompany } from '../application/organization-repository';
import { Database } from './database';

export interface OrganizationGateway {
  isConfigured(): boolean;
  sessionUserId(): Promise<string | null>;
  membershipOrganizationIds(userId: string): Promise<string[]>;
  organizationsByIds(ids: readonly string[]): Promise<Organization[]>;
  isOperator(userId: string): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  provision(input: ProvisionCompany): Promise<void>;
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
      .select('id, name')
      .in('id', [...ids]);
    if (error) {
      throw new OrganizationAccessError('load');
    }
    return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
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
