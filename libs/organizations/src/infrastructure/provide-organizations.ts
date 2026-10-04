import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { OrganizationRepository } from '../application/organization-repository';
import { SupabaseOrganizationGateway } from './organization-gateway';
import { SupabaseOrganizationRepository } from './supabase-organization-repository';

export function provideOrganizations(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: OrganizationRepository,
      useFactory: () =>
        new SupabaseOrganizationRepository(
          new SupabaseOrganizationGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
