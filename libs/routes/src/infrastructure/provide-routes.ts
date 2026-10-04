import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { RouteRepository } from '../application/route-repository';
import { SupabaseRouteGateway } from './route-gateway';
import { SupabaseRouteRepository } from './supabase-route-repository';

export function provideRoutes(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: RouteRepository,
      useFactory: () =>
        new SupabaseRouteRepository(
          new SupabaseRouteGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
