import { Route } from '@angular/router';
import { redirectSignedIn } from '@routeops/shared/supabase';
import { Contact } from './ui/contact';
import { Home } from './ui/home';

export const siteRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: Home,
    canActivate: [redirectSignedIn],
    data: { shell: false },
  },
  { path: 'contact', component: Contact, data: { shell: false } },
];
