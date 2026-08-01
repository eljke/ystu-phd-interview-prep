create type public.tournament_status as enum ('active', 'completed');

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id),
  created_by uuid not null references public.app_users(id),
  status public.tournament_status not null default 'active',
  current_round integer not null default 0 check (current_round >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index one_active_tournament_per_pair
on public.tournaments(pair_id) where status = 'active';

create table public.tournament_rounds (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  question_id text not null,
  question_type text not null check (question_type in ('single-choice', 'multiple-choice', 'matching', 'ordering', 'fill-blank')),
  correct_answer jsonb not null,
  explanation text not null,
  primary key (tournament_id, round_index)
);

create table public.tournament_answers (
  tournament_id uuid not null,
  round_index integer not null,
  user_id uuid not null references public.app_users(id),
  answer jsonb not null,
  score numeric(3,2) not null check (score between 0 and 1),
  submitted_at timestamptz not null default now(),
  primary key (tournament_id, round_index, user_id),
  foreign key (tournament_id, round_index)
    references public.tournament_rounds(tournament_id, round_index) on delete cascade
);

alter table public.tournaments enable row level security;
alter table public.tournament_rounds enable row level security;
alter table public.tournament_answers enable row level security;
revoke all on public.tournaments, public.tournament_rounds, public.tournament_answers from anon, authenticated;

create or replace function public.current_pair_id(candidate uuid default auth.uid())
returns uuid language sql stable security definer set search_path = '' as $$
  select m.pair_id
  from public.pair_members m
  join public.pairs p on p.id = m.pair_id and p.status = 'active'
  where m.user_id = candidate
  limit 1;
$$;

create or replace function public.create_pair_invite()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  active_pair_id uuid;
  raw_token text;
  expires_at timestamptz := now() + interval '24 hours';
begin
  if not public.is_allowed() then raise exception 'Access is not granted' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  active_pair_id := public.current_pair_id();
  if active_pair_id is null then
    insert into public.pairs(created_by) values (auth.uid()) returning id into active_pair_id;
    insert into public.pair_members(pair_id, user_id) values (active_pair_id, auth.uid());
  elsif (select count(*) from public.pair_members where pair_members.pair_id = active_pair_id) >= 2 then
    raise exception 'Pair already has two members';
  end if;
  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.pair_invites(pair_id, token_hash, created_by, expires_at)
  values (active_pair_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), auth.uid(), expires_at);
  return jsonb_build_object('token', raw_token, 'expiresAt', expires_at);
end;
$$;

create or replace function public.accept_pair_invite(raw_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invite public.pair_invites;
begin
  if not public.is_allowed() then raise exception 'Access is not granted' using errcode = '42501'; end if;
  select * into invite from public.pair_invites
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and accepted_at is null and expires_at > now()
  for update;
  if invite.id is null then raise exception 'Invite is invalid or expired'; end if;
  if invite.created_by = auth.uid() then raise exception 'Cannot accept your own invite'; end if;
  insert into public.pair_members(pair_id, user_id) values (invite.pair_id, auth.uid());
  update public.pair_invites set accepted_by = auth.uid(), accepted_at = now() where id = invite.id;
  return invite.pair_id;
end;
$$;

create or replace function public.get_current_pair()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare active_pair_id uuid := public.current_pair_id();
begin
  if active_pair_id is null then return null; end if;
  return jsonb_build_object(
    'id', active_pair_id,
    'members', (select jsonb_agg(jsonb_build_object('userId', u.id, 'displayName', u.display_name) order by m.joined_at)
      from public.pair_members m join public.app_users u on u.id = m.user_id where m.pair_id = active_pair_id)
  );
end;
$$;

create or replace function public.score_tournament_answer(question_type text, answer jsonb, correct_answer jsonb)
returns numeric language plpgsql immutable set search_path = '' as $$
begin
  if question_type = 'multiple-choice' then
    return case when
      (select jsonb_agg(value order by value) from jsonb_array_elements_text(answer)) =
      (select jsonb_agg(value order by value) from jsonb_array_elements_text(correct_answer))
      then 1 else 0 end;
  elsif question_type = 'fill-blank' then
    return case when exists (
      select 1 from jsonb_array_elements_text(correct_answer) accepted
      where trim(both ' ' from regexp_replace(replace(lower(trim(accepted)), 'ё', 'е'), '[^[:alnum:]]+', ' ', 'g')) =
        trim(both ' ' from regexp_replace(replace(lower(trim(answer #>> '{}')), 'ё', 'е'), '[^[:alnum:]]+', ' ', 'g'))
    ) then 1 else 0 end;
  end if;
  return case when answer = correct_answer then 1 else 0 end;
end;
$$;

create or replace function public.tournament_state(requested_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  tournament public.tournaments;
  round public.tournament_rounds;
  answer_count integer;
  mine public.tournament_answers;
  opponent public.tournament_answers;
begin
  select * into tournament from public.tournaments where id = requested_id;
  if tournament.id is null or tournament.pair_id <> public.current_pair_id() then
    raise exception 'Tournament is unavailable' using errcode = '42501';
  end if;
  select * into round from public.tournament_rounds
    where tournament_rounds.tournament_id = tournament.id and round_index = tournament.current_round;
  select count(*) into answer_count from public.tournament_answers a
    where a.tournament_id = tournament.id and a.round_index = tournament.current_round;
  select * into mine from public.tournament_answers a
    where a.tournament_id = tournament.id and a.round_index = tournament.current_round and a.user_id = auth.uid();
  if answer_count = 2 then
    select * into opponent from public.tournament_answers a
      where a.tournament_id = tournament.id and a.round_index = tournament.current_round and a.user_id <> auth.uid();
  end if;
  return jsonb_build_object(
    'id', tournament.id,
    'status', tournament.status,
    'currentRound', tournament.current_round,
    'totalRounds', (select count(*) from public.tournament_rounds r where r.tournament_id = tournament.id),
    'questionId', round.question_id,
    'submitted', mine.user_id is not null,
    'revealed', answer_count = 2,
    'myAnswer', case when mine.user_id is not null then mine.answer else null end,
    'opponentAnswer', case when answer_count = 2 then opponent.answer else null end,
    'correctAnswer', case when answer_count = 2 then round.correct_answer else null end,
    'explanation', case when answer_count = 2 then to_jsonb(round.explanation) else null end,
    'myRoundScore', case when answer_count = 2 then mine.score else null end,
    'opponentRoundScore', case when answer_count = 2 then opponent.score else null end,
    'myScore', (select coalesce(sum(a.score), 0) from public.tournament_answers a where a.tournament_id = tournament.id and a.user_id = auth.uid()),
    'opponentScore', (select coalesce(sum(a.score), 0) from public.tournament_answers a where a.tournament_id = tournament.id and a.user_id <> auth.uid())
  );
end;
$$;

create or replace function public.create_tournament(questions jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  active_pair_id uuid := public.current_pair_id();
  tournament_id uuid;
  question jsonb;
  index integer := 0;
begin
  if active_pair_id is null or (select count(*) from public.pair_members where pair_members.pair_id = active_pair_id) <> 2 then
    raise exception 'A complete pair is required';
  end if;
  if jsonb_typeof(questions) <> 'array' or jsonb_array_length(questions) not between 3 and 10 then
    raise exception 'Tournament must contain 3 to 10 questions';
  end if;
  insert into public.tournaments(pair_id, created_by) values (active_pair_id, auth.uid()) returning id into tournament_id;
  for question in select value from jsonb_array_elements(questions) loop
    if coalesce(question ->> 'id', '') = '' or coalesce(question ->> 'type', '') not in
      ('single-choice', 'multiple-choice', 'matching', 'ordering', 'fill-blank') or not (question ? 'correctAnswer') then
      raise exception 'Invalid tournament question';
    end if;
    insert into public.tournament_rounds(tournament_id, round_index, question_id, question_type, correct_answer, explanation)
    values (tournament_id, index, question ->> 'id', question ->> 'type', question -> 'correctAnswer', question ->> 'explanation');
    index := index + 1;
  end loop;
  return public.tournament_state(tournament_id);
end;
$$;

create or replace function public.get_active_tournament()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare active_tournament_id uuid;
begin
  select t.id into active_tournament_id from public.tournaments t
  where t.pair_id = public.current_pair_id()
  order by (t.status = 'active') desc, t.created_at desc limit 1;
  if active_tournament_id is null then return null; end if;
  return public.tournament_state(active_tournament_id);
end;
$$;

create or replace function public.submit_tournament_answer(tournament_id uuid, round_index integer, answer jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare round public.tournament_rounds;
begin
  select r.* into round from public.tournament_rounds r join public.tournaments t on t.id = r.tournament_id
  where r.tournament_id = submit_tournament_answer.tournament_id
    and r.round_index = submit_tournament_answer.round_index
    and t.current_round = r.round_index and t.status = 'active' and t.pair_id = public.current_pair_id();
  if round.tournament_id is null then raise exception 'Round is unavailable'; end if;
  insert into public.tournament_answers(tournament_id, round_index, user_id, answer, score)
  values (round.tournament_id, round.round_index, auth.uid(), answer,
    public.score_tournament_answer(round.question_type, answer, round.correct_answer));
  return public.tournament_state(round.tournament_id);
exception when unique_violation then
  raise exception 'Answer is already locked';
end;
$$;

create or replace function public.advance_tournament(requested_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare tournament public.tournaments;
declare total integer;
begin
  select * into tournament from public.tournaments where id = requested_id and pair_id = public.current_pair_id() for update;
  if tournament.id is null then raise exception 'Tournament is unavailable'; end if;
  if (select count(*) from public.tournament_answers a where a.tournament_id = tournament.id and a.round_index = tournament.current_round) <> 2 then
    raise exception 'Both answers are required';
  end if;
  select count(*) into total from public.tournament_rounds r where r.tournament_id = tournament.id;
  if tournament.current_round + 1 >= total then
    update public.tournaments set status = 'completed', completed_at = now() where id = tournament.id;
  else
    update public.tournaments set current_round = current_round + 1 where id = tournament.id;
  end if;
  return public.tournament_state(tournament.id);
end;
$$;

revoke all on function public.current_pair_id(uuid) from public;
revoke all on function public.score_tournament_answer(text, jsonb, jsonb) from public;
grant execute on function public.create_pair_invite() to authenticated;
grant execute on function public.accept_pair_invite(text) to authenticated;
grant execute on function public.get_current_pair() to authenticated;
grant execute on function public.create_tournament(jsonb) to authenticated;
grant execute on function public.get_active_tournament() to authenticated;
grant execute on function public.submit_tournament_answer(uuid, integer, jsonb) to authenticated;
grant execute on function public.advance_tournament(uuid) to authenticated;
