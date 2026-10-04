import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideDrivers } from './infrastructure/provide-drivers';
import { Drivers } from './ui/drivers';

export const driversRoutes: Route[] = [
  {
    path: '',
    providers: [provideDrivers()],
    canActivate: [requireSession],
    component: Drivers,
  },
];
