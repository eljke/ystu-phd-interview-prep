import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readRuntimeConfig } from '../../shared/config/runtimeConfig';

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = readRuntimeConfig(import.meta.env);
  client = config
    ? createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
  return client;
}
