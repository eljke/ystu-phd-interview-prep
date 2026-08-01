export interface RuntimeConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface RuntimeEnvironment {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

export function validateRuntimeConfig(environment: RuntimeEnvironment): string[] {
  const config = readRuntimeConfig(environment);
  if (!config) return ['VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required'];

  const errors: string[] = [];
  try {
    const url = new URL(config.supabaseUrl);
    if (url.protocol !== 'https:') errors.push('VITE_SUPABASE_URL must use HTTPS');
  } catch {
    errors.push('VITE_SUPABASE_URL must be a valid URL');
  }
  if (/your-|placeholder/i.test(config.supabaseUrl))
    errors.push('VITE_SUPABASE_URL still contains a placeholder');
  if (/your-|placeholder/i.test(config.supabasePublishableKey))
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY still contains a placeholder');
  return errors;
}

export function readRuntimeConfig(environment: RuntimeEnvironment): RuntimeConfig | null {
  const supabaseUrl = environment.VITE_SUPABASE_URL?.trim();
  const supabasePublishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !supabasePublishableKey) return null;
  return { supabaseUrl, supabasePublishableKey };
}
