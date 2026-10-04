import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'organizations/:organizationId/customers',
    loadChildren: () =>
      import('@routeops/customers').then((module) => module.customersRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('@routeops/organizations').then(
        (module) => module.organizationsRoutes,
      ),
  },
];
