import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { CustomerRepository } from '../application/customer-repository';
import { SupabaseCustomerGateway } from './customer-gateway';
import { SupabaseCustomerRepository } from './supabase-customer-repository';

export function provideCustomers(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CustomerRepository,
      useFactory: () =>
        new SupabaseCustomerRepository(
          new SupabaseCustomerGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
