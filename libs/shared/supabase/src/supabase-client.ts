import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SupabasePublishableConfig,
  supabasePublishableConfig,
} from './supabase-config';

export function createSupabaseClient(
  config: SupabasePublishableConfig,
): SupabaseClient | null {
  return config.url.length > 0 && config.publishableKey.length > 0
    ? createClient(config.url, config.publishableKey)
    : null;
}

// One client per tab, so every feature reads the same auth session.
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>(
  'SUPABASE_CLIENT',
  {
    providedIn: 'root',
    factory: () => createSupabaseClient(supabasePublishableConfig),
  },
);
