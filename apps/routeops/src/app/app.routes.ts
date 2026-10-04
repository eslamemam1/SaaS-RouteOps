import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('@routeops/organizations').then(
        (module) => module.organizationsRoutes,
      ),
  },
];
