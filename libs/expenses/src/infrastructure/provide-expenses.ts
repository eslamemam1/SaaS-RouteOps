import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { SUPABASE_CLIENT } from '@routeops/shared/supabase';
import { ExpenseRepository } from '../application/expense-repository';
import { SupabaseExpenseGateway } from './expense-gateway';
import { SupabaseExpenseRepository } from './supabase-expense-repository';

export function provideExpenses(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ExpenseRepository,
      useFactory: () =>
        new SupabaseExpenseRepository(
          new SupabaseExpenseGateway(inject(SUPABASE_CLIENT)),
        ),
    },
  ]);
}
