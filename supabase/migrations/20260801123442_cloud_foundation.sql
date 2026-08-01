create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.access_role as enum ('member', 'admin');
create type public.pair_status as enum ('active', 'archived');

create table public.access_entries (
  github_user_id bigint primary key check (github_user_id > 0),
  github_login extensions.citext not null unique,
  role public.access_role not null default 'member',
  active boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  github_user_id bigint not null unique references public.access_entries(github_user_id),
  github_login extensions.citext not null,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_allowed(candidate uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_users u
    join public.access_entries a on a.github_user_id = u.github_user_id
    where u.id = candidate and a.active
  );
$$;

create or replace function public.is_admin(candidate uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_users u
    join public.access_entries a on a.github_user_id = u.github_user_id
    where u.id = candidate and a.active and a.role = 'admin'
  );
$$;

create or replace function public.register_current_user()
returns public.app_users language plpgsql security definer set search_path = '' as $$
declare
  auth_user auth.users;
  github_id bigint;
  result public.app_users;
begin
  select * into auth_user from auth.users where id = auth.uid();
  if auth_user.id is null or coalesce(auth_user.raw_app_meta_data ->> 'provider', '') <> 'github' then
    raise exception 'GitHub authentication is required' using errcode = '42501';
  end if;
  github_id := coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'provider_id', '')::bigint,
    nullif(auth_user.raw_user_meta_data ->> 'sub', '')::bigint
  );
  if not exists (select 1 from public.access_entries where github_user_id = github_id and active) then
    raise exception 'Access is not granted' using errcode = '42501';
  end if;
  insert into public.app_users (id, github_user_id, github_login, display_name)
  values (
    auth_user.id,
    github_id,
    coalesce(auth_user.raw_user_meta_data ->> 'user_name', auth_user.raw_user_meta_data ->> 'preferred_username'),
    coalesce(auth_user.raw_user_meta_data ->> 'full_name', auth_user.raw_user_meta_data ->> 'name', auth_user.raw_user_meta_data ->> 'user_name')
  )
  on conflict (id) do update set
    github_login = excluded.github_login,
    display_name = excluded.display_name,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

create table public.pairs (
  id uuid primary key default gen_random_uuid(),
  status public.pair_status not null default 'active',
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.pair_members (
  pair_id uuid not null references public.pairs(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (pair_id, user_id)
);

create or replace function public.shares_pair(candidate uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pair_members mine
    join public.pairs p on p.id = mine.pair_id and p.status = 'active'
    join public.pair_members theirs on theirs.pair_id = mine.pair_id
    where mine.user_id = auth.uid() and theirs.user_id = candidate
  );
$$;

create or replace function public.enforce_pair_membership()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.pair_members where pair_id = new.pair_id) >= 2 then
    raise exception 'A pair cannot contain more than two members';
  end if;
  if exists (
    select 1 from public.pair_members m join public.pairs p on p.id = m.pair_id
    where m.user_id = new.user_id and p.status = 'active' and m.pair_id <> new.pair_id
  ) then
    raise exception 'A user already belongs to an active pair';
  end if;
  return new;
end;
$$;
create trigger enforce_pair_membership before insert on public.pair_members
for each row execute function public.enforce_pair_membership();

create table public.pair_invites (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  accepted_by uuid references public.app_users(id),
  accepted_at timestamptz,
  check (expires_at > created_at),
  check ((accepted_by is null) = (accepted_at is null))
);

create table public.topic_progress (
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id text not null,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table public.quiz_attempts (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id text not null,
  payload jsonb not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.oral_attempts (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id text not null,
  mode text not null check (mode in ('solo', 'live-pair', 'async-pair')),
  payload jsonb not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.partner_assessments (
  id uuid primary key,
  oral_attempt_id uuid not null references public.oral_attempts(id) on delete cascade,
  responder_id uuid not null references public.app_users(id),
  reviewer_id uuid not null references public.app_users(id),
  payload jsonb not null,
  completed_at timestamptz not null default now(),
  check (responder_id <> reviewer_id)
);

create table public.study_sessions (
  id uuid primary key,
  owner_id uuid not null references public.app_users(id),
  pair_id uuid references public.pairs(id),
  mode text not null,
  payload jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.live_pair_sessions (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id),
  responder_id uuid not null references public.app_users(id),
  reviewer_id uuid not null references public.app_users(id),
  topic_id text not null,
  phase text not null check (phase in ('waiting', 'preparation', 'answering', 'review', 'closed')),
  revision bigint not null default 1 check (revision > 0),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (responder_id <> reviewer_id)
);

create table public.audio_recordings (
  id uuid primary key default gen_random_uuid(),
  oral_attempt_id uuid not null references public.oral_attempts(id) on delete cascade,
  owner_id uuid not null references public.app_users(id),
  reviewer_id uuid references public.app_users(id),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  duration_seconds integer not null check (duration_seconds between 1 and 300),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  deleted_at timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '14 days')
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.app_users(id),
  action text not null,
  target_github_user_id bigint,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.access_entries enable row level security;
alter table public.app_users enable row level security;
alter table public.pairs enable row level security;
alter table public.pair_members enable row level security;
alter table public.pair_invites enable row level security;
alter table public.topic_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.oral_attempts enable row level security;
alter table public.partner_assessments enable row level security;
alter table public.study_sessions enable row level security;
alter table public.live_pair_sessions enable row level security;
alter table public.audio_recordings enable row level security;
alter table public.admin_audit_log enable row level security;

create policy access_read on public.access_entries for select to authenticated
using (public.is_admin() or github_user_id = (select github_user_id from public.app_users where id = auth.uid()));
create policy access_admin on public.access_entries for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy users_read on public.app_users for select to authenticated
using (public.is_allowed() and (id = auth.uid() or public.shares_pair(id) or public.is_admin()));
create policy pairs_member on public.pairs for select to authenticated
using (public.is_allowed() and exists (select 1 from public.pair_members where pair_id = id and user_id = auth.uid()));
create policy pair_members_read on public.pair_members for select to authenticated
using (public.is_allowed() and public.shares_pair(user_id));
create policy pair_invites_member on public.pair_invites for select to authenticated
using (public.is_allowed() and exists (select 1 from public.pair_members where pair_id = pair_invites.pair_id and user_id = auth.uid()));
create policy progress_pair on public.topic_progress for select to authenticated
using (public.is_allowed() and (user_id = auth.uid() or public.shares_pair(user_id)));
create policy progress_owner_write on public.topic_progress for all to authenticated
using (public.is_allowed() and user_id = auth.uid()) with check (public.is_allowed() and user_id = auth.uid());
create policy quiz_pair_read on public.quiz_attempts for select to authenticated
using (public.is_allowed() and (user_id = auth.uid() or public.shares_pair(user_id)));
create policy quiz_owner_insert on public.quiz_attempts for insert to authenticated
with check (public.is_allowed() and user_id = auth.uid());
create policy oral_pair_read on public.oral_attempts for select to authenticated
using (public.is_allowed() and (user_id = auth.uid() or public.shares_pair(user_id)));
create policy oral_owner_insert on public.oral_attempts for insert to authenticated
with check (public.is_allowed() and user_id = auth.uid());
create policy assessments_pair on public.partner_assessments for select to authenticated
using (public.is_allowed() and (responder_id = auth.uid() or reviewer_id = auth.uid()));
create policy assessments_reviewer_insert on public.partner_assessments for insert to authenticated
with check (public.is_allowed() and reviewer_id = auth.uid() and public.shares_pair(responder_id));
create policy sessions_access on public.study_sessions for select to authenticated
using (public.is_allowed() and (owner_id = auth.uid() or (pair_id is not null and exists (select 1 from public.pair_members where pair_members.pair_id = study_sessions.pair_id and user_id = auth.uid()))));
create policy sessions_owner_write on public.study_sessions for all to authenticated
using (public.is_allowed() and owner_id = auth.uid()) with check (public.is_allowed() and owner_id = auth.uid());
create policy live_pair_access on public.live_pair_sessions for all to authenticated
using (public.is_allowed() and exists (select 1 from public.pair_members where pair_id = live_pair_sessions.pair_id and user_id = auth.uid()))
with check (public.is_allowed() and exists (select 1 from public.pair_members where pair_id = live_pair_sessions.pair_id and user_id = auth.uid()));
create policy audio_pair_access on public.audio_recordings for select to authenticated
using (public.is_allowed() and (owner_id = auth.uid() or reviewer_id = auth.uid()));
create policy audio_owner_insert on public.audio_recordings for insert to authenticated
with check (public.is_allowed() and owner_id = auth.uid() and (reviewer_id is null or public.shares_pair(reviewer_id)));
create policy audit_admin_read on public.admin_audit_log for select to authenticated using (public.is_admin());

grant execute on function public.register_current_user() to authenticated;
grant execute on function public.is_allowed(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.shares_pair(uuid) to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
