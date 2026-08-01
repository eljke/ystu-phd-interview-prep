export interface RuntimeConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

interface RuntimeEnvironment {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

export function readRuntimeConfig(environment: RuntimeEnvironment): RuntimeConfig | null {
  const supabaseUrl = environment.VITE_SUPABASE_URL?.trim();
  const supabasePublishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !supabasePublishableKey) return null;
  return { supabaseUrl, supabasePublishableKey };
}
