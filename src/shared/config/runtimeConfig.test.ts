import { describe, expect, it } from 'vitest';
import { readRuntimeConfig } from './runtimeConfig';

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
