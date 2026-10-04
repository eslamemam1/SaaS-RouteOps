import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideOperations } from './infrastructure/provide-operations';
import { DailyOperations } from './ui/daily-operations';

export const operationsRoutes: Route[] = [
  {
    path: '',
    providers: [provideOperations()],
    canActivate: [requireSession],
    component: DailyOperations,
  },
];
