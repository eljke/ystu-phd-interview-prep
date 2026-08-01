begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'one@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"201","user_name":"one"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'two@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"202","user_name":"two"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'three@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"203","user_name":"three"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'four@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"204","user_name":"four"}', now(), now());
insert into public.access_entries (github_user_id, github_login, active) values
  (201, 'one', true), (202, 'two', true), (203, 'three', true), (204, 'four', true);
insert into public.app_users (id, github_user_id, github_login, display_name) values
  ('20000000-0000-0000-0000-000000000001', 201, 'one', 'One'),
  ('20000000-0000-0000-0000-000000000002', 202, 'two', 'Two'),
  ('20000000-0000-0000-0000-000000000003', 203, 'three', 'Three'),
  ('20000000-0000-0000-0000-000000000004', 204, 'four', 'Four');
insert into public.pairs (id, created_by) values
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
insert into public.pair_members (pair_id, user_id) values
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002');
create temporary table tournament_fixture(id uuid);
grant select, insert on tournament_fixture to authenticated;
create temporary table invite_fixture(token text);
grant select, insert on invite_fixture to authenticated;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000003', true);
set local role authenticated;
insert into invite_fixture select public.create_pair_invite() ->> 'token';
select is(length((select token from invite_fixture)), 48, 'creator receives a random invite token');
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000004', true);
set local role authenticated;
select lives_ok(
  $$select public.accept_pair_invite((select token from invite_fixture))$$,
  'a second whitelisted user accepts the invite'
);
select is(jsonb_array_length(public.get_current_pair() -> 'members'), 2, 'accepted pair contains exactly two members');

reset role;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into tournament_fixture
select (public.create_tournament('[
  {"id":"q1","type":"single-choice","correctAnswer":"a","explanation":"Because A"},
  {"id":"q2","type":"multiple-choice","correctAnswer":["a","b"],"explanation":"A and B"},
  {"id":"q3","type":"fill-blank","correctAnswer":["расчетная сетка"],"explanation":"Term"}
]'::jsonb) ->> 'id')::uuid;
select is((public.get_active_tournament() ->> 'revealed')::boolean, false, 'round starts sealed');
select lives_ok(
  $$select public.submit_tournament_answer((select id from tournament_fixture), 0, '"a"'::jsonb)$$,
  'first answer is accepted'
);
select is(public.get_active_tournament() ->> 'opponentAnswer', null, 'first player cannot see missing opponent answer');

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select is(public.get_active_tournament() ->> 'opponentAnswer', null, 'second player cannot see the first answer before submitting');
select is(public.get_active_tournament() ->> 'correctAnswer', null, 'correct answer stays hidden before both submit');
select lives_ok(
  $$select public.submit_tournament_answer((select id from tournament_fixture), 0, '"b"'::jsonb)$$,
  'second answer is accepted'
);
select ok(
  (public.get_active_tournament() ->> 'revealed')::boolean
    and public.get_active_tournament() ->> 'opponentAnswer' = 'a'
    and public.get_active_tournament() ->> 'correctAnswer' = 'a',
  'both answers and the key reveal together'
);

select * from finish();
rollback;
