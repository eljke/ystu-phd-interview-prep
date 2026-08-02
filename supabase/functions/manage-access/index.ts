import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Role = 'member' | 'admin';
type Command =
  | { action: 'grant'; githubLogin: string; role: Role }
  | { action: 'revoke'; githubLogin: string }
  | { action: 'set-role'; githubLogin: string; role: Role };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseCommand(value: unknown): Command | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const githubLogin = typeof body.githubLogin === 'string' ? body.githubLogin.trim() : '';
  if (!/^[A-Za-z0-9-]{1,39}$/.test(githubLogin)) return null;
  if (body.action === 'revoke') return { action: 'revoke', githubLogin };
  if (
    (body.action === 'grant' || body.action === 'set-role') &&
    (body.role === 'member' || body.role === 'admin')
  ) {
    return { action: body.action, githubLogin, role: body.role };
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Authentication required' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server is not configured' }, 500);
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Invalid session' }, 401);

  const { data: actorUser, error: actorUserError } = await adminClient
    .from('app_users')
    .select('github_user_id')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (actorUserError) return json({ error: actorUserError.message }, 500);
  if (!actorUser) return json({ error: 'Application profile is missing' }, 403);
  const { data: actorAccess, error: actorError } = await adminClient
    .from('access_entries')
    .select('github_user_id')
    .eq('github_user_id', actorUser.github_user_id)
    .eq('active', true)
    .eq('role', 'admin')
    .maybeSingle();
  if (actorError) return json({ error: actorError.message }, 500);
  if (!actorAccess) return json({ error: 'Administrator role required' }, 403);
  const actor = { id: authData.user.id, github_user_id: Number(actorUser.github_user_id) };

  let command: Command | null = null;
  try {
    command = parseCommand(await request.json());
  } catch {
    command = null;
  }
  if (!command) return json({ error: 'Invalid request' }, 400);

  const githubResponse = await fetch(
    `https://api.github.com/users/${encodeURIComponent(command.githubLogin)}`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ystu-interview-prep' } },
  );
  if (!githubResponse.ok) return json({ error: 'GitHub account not found' }, 404);
  const githubUser = (await githubResponse.json()) as { id?: unknown; login?: unknown };
  if (typeof githubUser.id !== 'number' || typeof githubUser.login !== 'string') {
    return json({ error: 'Unexpected GitHub response' }, 502);
  }
  if (
    githubUser.id === actor.github_user_id &&
    (command.action === 'revoke' || (command.action === 'set-role' && command.role !== 'admin'))
  ) {
    return json({ error: 'Нельзя отозвать собственный административный доступ.' }, 409);
  }

  const patch =
    command.action === 'revoke'
      ? { active: false, updated_by: actor.id, updated_at: new Date().toISOString() }
      : {
          github_user_id: githubUser.id,
          github_login: githubUser.login,
          role: command.role,
          active: true,
          updated_by: actor.id,
          updated_at: new Date().toISOString(),
        };
  const mutation =
    command.action === 'grant'
      ? adminClient
          .from('access_entries')
          .upsert({ ...patch, created_by: actor.id }, { onConflict: 'github_user_id' })
      : adminClient.from('access_entries').update(patch).eq('github_user_id', githubUser.id);
  const { error: mutationError } = await mutation;
  if (mutationError) return json({ error: mutationError.message }, 400);

  const { error: auditError } = await adminClient.from('admin_audit_log').insert({
    actor_id: actor.id,
    action: command.action,
    target_github_user_id: githubUser.id,
    details: {
      githubLogin: githubUser.login,
      ...('role' in command ? { role: command.role } : {}),
    },
  });
  if (auditError) return json({ error: auditError.message }, 500);
  return json({ ok: true });
});
