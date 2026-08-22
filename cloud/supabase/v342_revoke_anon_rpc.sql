-- FE QUEST v342 Supabase hardening.
-- Supabase grants EXECUTE on exposed functions to anon/authenticated by default.
-- The sync RPC is intentionally available only to signed-in users.

begin;

revoke execute on function public.fequest_commit_profile_v342(
  uuid,bigint,integer,bigint,timestamptz,text,jsonb,text
) from anon;

commit;
