begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'admin@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"101","user_name":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'member@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"102","user_name":"member"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated', 'denied@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"103","user_name":"denied"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000104', 'authenticated', 'authenticated', 'outsider@example.test', '', now(), '{"provider":"github"}', '{"provider_id":"104","user_name":"outsider"}', now(), now());

insert into public.access_entries (github_user_id, github_login, role, active) values
  (101, 'admin', 'admin', true), (102, 'member', 'member', true),
  (103, 'denied', 'member', false), (104, 'outsider', 'member', true);
insert into public.app_users (id, github_user_id, github_login, display_name) values
  ('00000000-0000-0000-0000-000000000101', 101, 'admin', 'Admin'),
  ('00000000-0000-0000-0000-000000000102', 102, 'member', 'Member'),
  ('00000000-0000-0000-0000-000000000103', 103, 'denied', 'Denied'),
  ('00000000-0000-0000-0000-000000000104', 104, 'outsider', 'Outsider');

insert into public.pairs (id, created_by) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101');
insert into public.pair_members (pair_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102');
insert into public.topic_progress (user_id, topic_id, payload) values
  ('00000000-0000-0000-0000-000000000101', 'topic-1-1', '{}'),
  ('00000000-0000-0000-0000-000000000104', 'topic-1-1', '{}');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);
set local role authenticated;

select ok(public.is_allowed(), 'active whitelist member is allowed');
select ok(not public.is_admin(), 'ordinary member is not admin');
select ok(public.shares_pair('00000000-0000-0000-0000-000000000101'), 'pair membership is recognized');
select results_eq(
  'select count(*)::bigint from public.topic_progress',
  'values (1::bigint)',
  'member reads partner progress but not outsider progress'
);
select is_empty(
  $$update public.access_entries set active = false where github_user_id = 101 returning github_user_id$$,
  'member cannot mutate whitelist'
);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
set local role authenticated;
select ok(not public.is_allowed(), 'revoked whitelist member is denied');
select results_eq(
  'select count(*)::bigint from public.topic_progress',
  'values (0::bigint)',
  'revoked member reads no progress'
);

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
set local role authenticated;
select ok(public.is_admin(), 'admin whitelist role is recognized');

select * from finish();
rollback;
