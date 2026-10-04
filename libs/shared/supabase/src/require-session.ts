import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { SUPABASE_CLIENT } from './supabase-client';

export const requireSession: CanActivateFn = async () => {
  const client = inject(SUPABASE_CLIENT);
  const router = inject(Router);
  const signIn = new RedirectCommand(router.parseUrl('/sign-in'));
  if (!client) {
    return signIn;
  }
  const { data, error } = await client.auth.getUser();
  return !error && data.user ? true : signIn;
};
