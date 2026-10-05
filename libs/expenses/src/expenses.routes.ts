import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideExpenses } from './infrastructure/provide-expenses';
import { Expenses } from './ui/expenses';

export const expensesRoutes: Route[] = [
  {
    path: '',
    providers: [provideExpenses()],
    canActivate: [requireSession],
    component: Expenses,
  },
];
