import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'organizations/:organizationId/customers',
    loadChildren: () =>
      import('@routeops/customers').then((module) => module.customersRoutes),
  },
  {
    path: 'organizations/:organizationId/vehicles',
    loadChildren: () =>
      import('@routeops/vehicles').then((module) => module.vehiclesRoutes),
  },
  {
    path: 'organizations/:organizationId/drivers',
    loadChildren: () =>
      import('@routeops/drivers').then((module) => module.driversRoutes),
  },
  {
    path: 'organizations/:organizationId/routes',
    loadChildren: () =>
      import('@routeops/routes').then((module) => module.routesRoutes),
  },
  {
    path: 'organizations/:organizationId/operations',
    loadChildren: () =>
      import('@routeops/operations').then((module) => module.operationsRoutes),
  },
  {
    path: 'organizations/:organizationId/reports',
    loadChildren: () =>
      import('@routeops/reports').then((module) => module.reportsRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('@routeops/organizations').then(
        (module) => module.organizationsRoutes,
      ),
  },
];
