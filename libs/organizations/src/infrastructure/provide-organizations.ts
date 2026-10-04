import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { OrganizationRepository } from '../application/organization-repository';
import {
  SupabaseOrganizationGateway,
  SupabasePublishableConfig,
} from './organization-gateway';
import { SupabaseOrganizationRepository } from './supabase-organization-repository';

export function provideOrganizations(
  config: SupabasePublishableConfig,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: OrganizationRepository,
      useFactory: () =>
        new SupabaseOrganizationRepository(
          new SupabaseOrganizationGateway(config),
        ),
    },
  ]);
}
