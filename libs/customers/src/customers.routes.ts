import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideCustomers } from './infrastructure/provide-customers';
import { Customers } from './ui/customers';

export const customersRoutes: Route[] = [
  {
    path: '',
    providers: [provideCustomers()],
    canActivate: [requireSession],
    component: Customers,
  },
];
