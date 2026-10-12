import { Route } from '@angular/router';
import { redirectSignedIn } from '@routeops/shared/supabase';
import { providePricing } from './infrastructure/supabase-pricing-repository';
import { Contact } from './ui/contact';
import { Home } from './ui/home';
import { Pricing } from './ui/pricing';

export const siteRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: Home,
    canActivate: [redirectSignedIn],
    providers: [providePricing()],
    data: { shell: false },
  },
  { path: 'contact', component: Contact, data: { shell: false } },
  {
    path: 'pricing',
    component: Pricing,
    providers: [providePricing()],
    data: { shell: false },
  },
];
