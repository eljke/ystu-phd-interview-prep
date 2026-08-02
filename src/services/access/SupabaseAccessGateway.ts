import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccessEntry, AccessGateway, AccessMutation } from './AccessGateway';

export class SupabaseAccessGateway implements AccessGateway {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<AccessEntry[]> {
    const { data, error } = await this.client
      .from('access_entries')
      .select('github_user_id, github_login, role, active')
      .order('github_login');
    if (error) throw error;
    return data.map((entry) => ({
      githubUserId: entry.github_user_id as number,
      githubLogin: entry.github_login as string,
      role: entry.role as 'member' | 'admin',
      active: entry.active as boolean,
    }));
  }

  async mutate(command: AccessMutation): Promise<void> {
    const { error } = await this.client.functions.invoke('manage-access', { body: command });
    if (!error) return;
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      const body = (await context.clone().json().catch(() => null)) as { error?: unknown } | null;
      if (typeof body?.error === 'string') throw new Error(body.error);
    }
    throw error;
  }
}
