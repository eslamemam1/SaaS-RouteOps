import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideRoutes } from './infrastructure/provide-routes';
import { TransportRoutes } from './ui/transport-routes';

export const routesRoutes: Route[] = [
  {
    path: '',
    providers: [provideRoutes()],
    canActivate: [requireSession],
    component: TransportRoutes,
  },
];
