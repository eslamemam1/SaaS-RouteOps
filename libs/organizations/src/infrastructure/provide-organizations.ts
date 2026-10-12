import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from '../application/organization-repository';
import { SubscriptionRepository } from '../application/subscription-repository';
import { SupabaseOrganizationGateway } from './organization-gateway';
import { SupabaseOrganizationRepository } from './supabase-organization-repository';
import { SubscriptionDatabase } from './subscription-database';
import { SupabaseSubscriptionRepository } from './supabase-subscription-repository';

export function provideOrganizations(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: OrganizationRepository,
      useFactory: () =>
        new SupabaseOrganizationRepository(
          new SupabaseOrganizationGateway(inject(SUPABASE_CLIENT)),
        ),
    },
    {
      provide: SubscriptionRepository,
      useFactory: () =>
        new SupabaseSubscriptionRepository(
          inject(
            SUPABASE_CLIENT,
          ) as SupabaseClient<SubscriptionDatabase> | null,
        ),
    },
  ]);
}
