import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { VehicleRepository } from '../application/vehicle-repository';
import { SupabaseVehicleGateway } from './vehicle-gateway';
import { SupabaseVehicleRepository } from './supabase-vehicle-repository';

export function provideVehicles(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: VehicleRepository,
      useFactory: () =>
        new SupabaseVehicleRepository(
          new SupabaseVehicleGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
