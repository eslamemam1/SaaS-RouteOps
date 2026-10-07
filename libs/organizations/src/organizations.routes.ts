import { Route } from '@angular/router';
import { requireSession } from '@routeops/shared/supabase';
import { provideOrganizations } from './infrastructure/provide-organizations';
import { Organizations } from './ui/organizations';
import { SignIn } from './ui/sign-in';
import { SignOut } from './ui/sign-out';

export const organizationsRoutes: Route[] = [
  {
    path: '',
    providers: [provideOrganizations()],
    children: [
      { path: 'sign-in', component: SignIn, data: { shell: false } },
      { path: 'sign-out', component: SignOut, data: { shell: false } },
      { path: 'dashboard', component: Organizations, canActivate: [requireSession] },
    ],
  },
];
