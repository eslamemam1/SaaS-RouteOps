import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { SUPABASE_CLIENT } from './supabase-client';

// A stored session is enough here: this only picks the page, and the
// dashboard checks the user again with requireSession.
export const redirectSignedIn: CanActivateFn = async () => {
  const client = inject(SUPABASE_CLIENT);
  const router = inject(Router);
  if (!client) {
    return true;
  }
  const { data } = await client.auth.getSession();
  return data.session ? new RedirectCommand(router.parseUrl('/dashboard')) : true;
};
