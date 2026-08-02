import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, it, vi } from 'vitest';
import { SupabaseAccessGateway } from './SupabaseAccessGateway';

it('shows the error returned by the access function', async () => {
  const invoke = vi.fn().mockResolvedValue({
    data: null,
    error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: 'Administrator role required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  });
  const client = { functions: { invoke } } as unknown as SupabaseClient;
  const gateway = new SupabaseAccessGateway(client);

  await expect(
    gateway.mutate({ action: 'grant', githubLogin: 'vlistoff418', role: 'admin' }),
  ).rejects.toThrow('Administrator role required');
});
