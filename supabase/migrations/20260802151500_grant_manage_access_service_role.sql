grant select, insert, update, delete
on public.access_entries, public.app_users, public.admin_audit_log
to service_role;

grant usage, select
on sequence public.admin_audit_log_id_seq
to service_role;
