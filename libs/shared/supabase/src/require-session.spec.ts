import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RedirectCommand,
  RouterStateSnapshot,
} from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { requireSession } from './require-session';
import { SUPABASE_CLIENT } from './supabase-client';

describe('requireSession', () => {
  it('allows a signed-in user', async () => {
    const result = await run(fakeClient({ id: 'user-1' }, null));

    expect(result).toBe(true);
  });

  it('redirects to sign-in when there is no session', async () => {
    const result = await run(fakeClient(null, { message: 'Auth session missing' }));

    expect(redirectPath(result)).toBe('/sign-in');
  });

  it('redirects to sign-in when the app is not connected', async () => {
    const result = await run(null);

    expect(redirectPath(result)).toBe('/sign-in');
  });
});

function run(client: SupabaseClient | null): Promise<unknown> {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: SUPABASE_CLIENT, useValue: client }],
  });
  return TestBed.runInInjectionContext(() =>
    requireSession({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as Promise<unknown>;
}

function redirectPath(result: unknown): string | null {
  return result instanceof RedirectCommand ? result.redirectTo.toString() : null;
}

function fakeClient(
  user: { id: string } | null,
  error: { message: string } | null,
): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user }, error }),
    },
  } as unknown as SupabaseClient;
}
