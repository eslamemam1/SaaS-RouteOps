import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideDrivers } from './infrastructure/provide-drivers';
import { DriverPage } from './ui/driver-page';
import { Drivers } from './ui/drivers';

export const driversRoutes: Route[] = [
  {
    path: '',
    providers: [provideDrivers()],
    canActivate: [requireSession],
    children: [
      { path: '', component: Drivers },
      { path: ':driverId', component: DriverPage },
    ],
  },
];
