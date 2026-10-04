import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideVehicles } from './infrastructure/provide-vehicles';
import { Vehicles } from './ui/vehicles';

export const vehiclesRoutes: Route[] = [
  {
    path: '',
    providers: [provideVehicles()],
    canActivate: [requireSession],
    component: Vehicles,
  },
];
