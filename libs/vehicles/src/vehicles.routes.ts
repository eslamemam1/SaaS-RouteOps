import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideVehicles } from './infrastructure/provide-vehicles';
import { VehiclePage } from './ui/vehicle-page';
import { Vehicles } from './ui/vehicles';

export const vehiclesRoutes: Route[] = [
  {
    path: '',
    providers: [provideVehicles()],
    canActivate: [requireSession],
    children: [
      { path: '', component: Vehicles },
      { path: ':vehicleId', component: VehiclePage },
    ],
  },
];
