import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Route, Router } from '@angular/router';
import { OrganizationRepository } from './application/organization-repository';
import { provideOrganizations } from './infrastructure/provide-organizations';
import { supabasePublishableConfig } from './infrastructure/supabase-config';
import { Organizations } from './ui/organizations';
import { SignIn } from './ui/sign-in';

const requireSession: CanActivateFn = async () => {
  const repository = inject(OrganizationRepository);
  const router = inject(Router);
  const signedIn = await repository.hasSession();
  return signedIn ? true : new RedirectCommand(router.parseUrl('/sign-in'));
};

export const organizationsRoutes: Route[] = [
  {
    path: '',
    providers: [provideOrganizations(supabasePublishableConfig)],
    children: [
      { path: 'sign-in', component: SignIn },
      { path: '', component: Organizations, canActivate: [requireSession] },
    ],
  },
];
