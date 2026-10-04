import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { OperationsRepository } from '../application/operations-repository';
import { SupabaseOperationsGateway } from './operations-gateway';
import { SupabaseOperationsRepository } from './supabase-operations-repository';

export function provideOperations(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: OperationsRepository,
      useFactory: () =>
        new SupabaseOperationsRepository(
          new SupabaseOperationsGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
