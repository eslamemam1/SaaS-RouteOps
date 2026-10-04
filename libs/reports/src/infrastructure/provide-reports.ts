import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { ReportsRepository } from '../application/reports-repository';
import { SupabaseReportsGateway } from './reports-gateway';
import { SupabaseReportsRepository } from './supabase-reports-repository';

export function provideReports(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ReportsRepository,
      useFactory: () =>
        new SupabaseReportsRepository(
          new SupabaseReportsGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
