-- FE QUEST v342 cloud sync foundation
-- Provider: Supabase/Postgres
-- This file defines the remote ownership and compare-and-swap contract only.
-- It does not make cloud sync mandatory and it must never require a service_role key in the PWA.

begin;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_schema_version integer not null check (profile_schema_version > 0),
  profile_revision bigint not null check (profile_revision >= 0),
  client_updated_at timestamptz not null,
  writer_id text,
  payload jsonb not null,
  payload_checksum text not null check (payload_checksum ~ '^(fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$'),
  server_updated_at timestamptz not null default now()
);

-- Foundation builds created before the production persistence boundary was audited used
-- a bare payload_sha256 column. If that unpublished/development schema exists, migrate it
-- to an algorithm-prefixed checksum without touching profile revisions or payload JSON.
alter table public.user_profiles add column if not exists payload_checksum text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='user_profiles' and column_name='payload_sha256'
  ) then
    execute $sql$
      update public.user_profiles
      set payload_checksum = 'sha256:' || payload_sha256
      where payload_checksum is null and payload_sha256 ~ '^[0-9a-f]{64}$'
    $sql$;
  end if;
end $$;

alter table public.user_profiles alter column payload_checksum set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.user_profiles'::regclass and conname='user_profiles_payload_checksum_v342_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_payload_checksum_v342_check
      check (payload_checksum ~ '^(fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$');
  end if;
end $$;

-- The RPC signature uses the same SQL types as the early foundation version. Drop it
-- before renaming its semantic checksum argument/return column so repeated setup is safe.
drop function if exists public.fequest_commit_profile_v342(
  uuid,bigint,integer,bigint,timestamptz,text,jsonb,text
);

-- Once legacy values have been copied, the ambiguous bare-SHA column is no longer needed.
alter table public.user_profiles drop column if exists payload_sha256;

comment on table public.user_profiles is
  'One local-first FE QUEST profile snapshot per authenticated user. Remote state is a backup/sync replica, never a prerequisite for local study.';
comment on column public.user_profiles.profile_revision is
  'Revision carried from the committed local profile. Do not use numeric comparison alone to infer ancestry across devices; compare-and-swap also checks the device last-synced remote revision.';
comment on column public.user_profiles.payload is
  'Schema-versioned FE QUEST profile JSON. Keep local recovery/export independent from this remote copy.';
comment on column public.user_profiles.payload_checksum is
  'Checksum copied from the committed FE QUEST local atomic profile. The algorithm is explicit in the value, currently fnv1a32. Same-revision idempotency also compares JSONB payload equality to avoid relying on a 32-bit checksum alone.';

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;

-- Idempotent policy creation for repeated setup in development projects.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='fequest_profile_select_own'
  ) then
    create policy fequest_profile_select_own
      on public.user_profiles for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='fequest_profile_insert_own'
  ) then
    create policy fequest_profile_insert_own
      on public.user_profiles for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='fequest_profile_update_own'
  ) then
    create policy fequest_profile_update_own
      on public.user_profiles for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='fequest_profile_delete_own'
  ) then
    create policy fequest_profile_delete_own
      on public.user_profiles for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

-- Compare-and-swap RPC.
-- p_base_remote_revision is the remote revision this device last successfully synced.
-- It protects against the classic two-device case where a stale device accumulates a
-- numerically higher local revision while another device has already changed the remote.
create function public.fequest_commit_profile_v342(
  p_user_id uuid,
  p_base_remote_revision bigint,
  p_profile_schema_version integer,
  p_profile_revision bigint,
  p_client_updated_at timestamptz,
  p_writer_id text,
  p_payload jsonb,
  p_payload_checksum text
)
returns table (
  sync_status text,
  remote_revision bigint,
  remote_checksum text,
  remote_client_updated_at timestamptz,
  remote_server_updated_at timestamptz,
  remote_payload jsonb
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_row public.user_profiles%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null or v_uid <> p_user_id then
    raise exception 'FEQUEST_SYNC_FORBIDDEN' using errcode = '42501';
  end if;

  if p_profile_schema_version <= 0
     or p_profile_revision < 0
     or p_payload is null
     or p_payload_checksum !~ '^(fnv1a32:[0-9a-f]{8}|sha256:[0-9a-f]{64})$' then
    raise exception 'FEQUEST_SYNC_INVALID_PAYLOAD' using errcode = '22023';
  end if;

  select * into v_row
  from public.user_profiles
  where user_id = p_user_id
  for update;

  if not found then
    -- A device that believes it previously synced a remote row must not recreate a
    -- missing row silently; require the client to surface/reconcile that state.
    if p_base_remote_revision is not null then
      return query select
        'remote-missing-conflict'::text,
        null::bigint,
        null::text,
        null::timestamptz,
        null::timestamptz,
        null::jsonb;
      return;
    end if;

    insert into public.user_profiles(
      user_id, profile_schema_version, profile_revision, client_updated_at,
      writer_id, payload, payload_checksum, server_updated_at
    ) values (
      p_user_id, p_profile_schema_version, p_profile_revision, p_client_updated_at,
      p_writer_id, p_payload, p_payload_checksum, now()
    )
    returning * into v_row;

    return query select
      'uploaded-new'::text,
      v_row.profile_revision,
      v_row.payload_checksum,
      v_row.client_updated_at,
      v_row.server_updated_at,
      v_row.payload;
    return;
  end if;

  -- Exact JSONB replay is always safe and makes retry after a lost HTTP response
  -- idempotent. Do not rely on FNV-1a checksum equality alone for this decision.
  if p_profile_revision = v_row.profile_revision
     and p_payload = v_row.payload then
    return query select
      'already-synced'::text,
      v_row.profile_revision,
      v_row.payload_checksum,
      v_row.client_updated_at,
      v_row.server_updated_at,
      v_row.payload;
    return;
  end if;

  -- Same revision but different JSON means two branches diverged, even in the
  -- astronomically unlikely event that their non-cryptographic checksums collide.
  if p_profile_revision = v_row.profile_revision then
    return query select
      'diverged-same-revision'::text,
      v_row.profile_revision,
      v_row.payload_checksum,
      v_row.client_updated_at,
      v_row.server_updated_at,
      v_row.payload;
    return;
  end if;

  -- CAS ancestry check: if the remote moved since this device's last successful sync,
  -- a numerically higher local revision is still stale and must not overwrite it.
  if p_base_remote_revision is distinct from v_row.profile_revision then
    return query select
      'remote-changed-conflict'::text,
      v_row.profile_revision,
      v_row.payload_checksum,
      v_row.client_updated_at,
      v_row.server_updated_at,
      v_row.payload;
    return;
  end if;

  if p_profile_revision <= v_row.profile_revision then
    return query select
      'remote-newer-or-equal'::text,
      v_row.profile_revision,
      v_row.payload_checksum,
      v_row.client_updated_at,
      v_row.server_updated_at,
      v_row.payload;
    return;
  end if;

  update public.user_profiles
  set profile_schema_version = p_profile_schema_version,
      profile_revision = p_profile_revision,
      client_updated_at = p_client_updated_at,
      writer_id = p_writer_id,
      payload = p_payload,
      payload_checksum = p_payload_checksum,
      server_updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  return query select
    'uploaded-update'::text,
    v_row.profile_revision,
    v_row.payload_checksum,
    v_row.client_updated_at,
    v_row.server_updated_at,
    v_row.payload;
end;
$$;

revoke all on function public.fequest_commit_profile_v342(
  uuid,bigint,integer,bigint,timestamptz,text,jsonb,text
) from public;
grant execute on function public.fequest_commit_profile_v342(
  uuid,bigint,integer,bigint,timestamptz,text,jsonb,text
) to authenticated;

-- Browser clients should use RLS for normal reads and the RPC above for writes.
-- Direct table writes are not required by v342. Keep grants narrow so blind upsert is
-- not accidentally introduced later.
revoke insert, update, delete on public.user_profiles from authenticated;
grant select on public.user_profiles to authenticated;

commit;
