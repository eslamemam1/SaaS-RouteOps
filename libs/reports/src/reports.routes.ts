import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideReports } from './infrastructure/provide-reports';
import { Reports } from './ui/reports';

export const reportsRoutes: Route[] = [
  {
    path: '',
    providers: [provideReports()],
    canActivate: [requireSession],
    component: Reports,
  },
];
