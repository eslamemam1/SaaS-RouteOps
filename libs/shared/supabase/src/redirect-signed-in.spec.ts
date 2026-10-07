import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RedirectCommand,
  RouterStateSnapshot,
} from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import { redirectSignedIn } from './redirect-signed-in';
import { SUPABASE_CLIENT } from './supabase-client';

describe('redirectSignedIn', () => {
  it('sends a signed-in user to the dashboard', async () => {
    const result = await run(fakeClient({ access_token: 'token' }));

    expect(result instanceof RedirectCommand ? result.redirectTo.toString() : null).toBe(
      '/dashboard',
    );
  });

  it('shows the page to a visitor', async () => {
    expect(await run(fakeClient(null))).toBe(true);
  });

  it('shows the page when the app is not connected', async () => {
    expect(await run(null)).toBe(true);
  });
});

function run(client: SupabaseClient | null): Promise<unknown> {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: SUPABASE_CLIENT, useValue: client }],
  });
  return TestBed.runInInjectionContext(() =>
    redirectSignedIn({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as Promise<unknown>;
}

function fakeClient(session: { access_token: string } | null): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
    },
  } as unknown as SupabaseClient;
}
