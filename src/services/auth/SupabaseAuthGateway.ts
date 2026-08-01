import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccessDecision, AuthGateway, AuthSession } from './AuthGateway';

interface RegisteredUser {
  github_user_id: number;
}

export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly client: SupabaseClient) {}

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (!user) return null;
    const githubLogin = user.user_metadata.user_name ?? user.user_metadata.preferred_username ?? '';
    return { userId: user.id, githubLogin: String(githubLogin) };
  }

  async signInWithGitHub(redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async checkAccess(): Promise<AccessDecision> {
    const registration = await this.client.rpc('register_current_user');
    if (registration.error) {
      return { status: 'denied', message: 'Ваш GitHub-аккаунт отсутствует в списке доступа.' };
    }
    const registered = registration.data as RegisteredUser;
    const access = await this.client
      .from('access_entries')
      .select('role, active')
      .eq('github_user_id', registered.github_user_id)
      .single();
    if (access.error || !access.data.active) {
      return { status: 'denied', message: 'Доступ к приложению отозван.' };
    }
    return { status: 'allowed', role: access.data.role as 'member' | 'admin' };
  }
}
