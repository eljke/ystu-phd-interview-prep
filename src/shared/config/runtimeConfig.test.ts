import { describe, expect, it } from 'vitest';
import { readRuntimeConfig, validateRuntimeConfig } from './runtimeConfig';

describe('readRuntimeConfig', () => {
  it('returns cloud configuration when both values are present', () => {
    expect(
      readRuntimeConfig({
        VITE_SUPABASE_URL: ' https://project.supabase.co ',
        VITE_SUPABASE_PUBLISHABLE_KEY: ' publishable-key ',
      }),
    ).toEqual({
      supabaseUrl: 'https://project.supabase.co',
      supabasePublishableKey: 'publishable-key',
    });
  });

  it.each([
    {},
    { VITE_SUPABASE_URL: 'https://project.supabase.co' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key' },
    { VITE_SUPABASE_URL: ' ', VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key' },
  ])('returns null for incomplete configuration', (environment) => {
    expect(readRuntimeConfig(environment)).toBeNull();
  });
});

describe('validateRuntimeConfig', () => {
  it('rejects missing, insecure and placeholder production values', () => {
    expect(validateRuntimeConfig({})).not.toHaveLength(0);
    expect(
      validateRuntimeConfig({
        VITE_SUPABASE_URL: 'http://your-project.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'your-publishable-key',
      }),
    ).toHaveLength(3);
  });

  it('accepts a configured Supabase project', () => {
    expect(
      validateRuntimeConfig({
        VITE_SUPABASE_URL: 'https://abc.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toEqual([]);
  });
});
