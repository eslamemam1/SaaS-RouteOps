import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { DriverRepository } from '../application/driver-repository';
import { SupabaseDriverGateway } from './driver-gateway';
import { SupabaseDriverRepository } from './supabase-driver-repository';

export function provideDrivers(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DriverRepository,
      useFactory: () =>
        new SupabaseDriverRepository(
          new SupabaseDriverGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
