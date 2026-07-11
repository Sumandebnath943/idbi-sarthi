/*
  IDBI SARTHI - Auth & audit tables (Supabase).
  Run once in the Supabase SQL editor. Safe to re-run (idempotent).

  Both tables are RLS-locked with NO anon/authenticated policies: they are read
  and written ONLY by the server using the service_role key (which bypasses RLS).
  This keeps password hashes and the audit trail unreachable via the public
  anon key even if it leaks.

  After creating app_users, seed it with:  bun run scripts/seed-users.mjs
*/

-- ---- Application users (credentials login) ----
create table if not exists app_users (
  id            text primary key,
  email         text unique not null,
  name          text not null,
  role          text not null check (role in ('rm','manager','compliance','admin')),
  rm_id         text,
  password_hash text not null,
  is_active     boolean not null default true,
  created_at    timestamptz default now()
);

alter table app_users enable row level security;
revoke all on app_users from anon, authenticated;
-- (No policies added -> anon/authenticated get nothing; service_role bypasses RLS.)

-- ---- Append-only audit log ----
create table if not exists audit_log (
  id             bigint generated always as identity primary key,
  ts             timestamptz not null default now(),
  type           text not null,
  actor_id       text,
  actor_role     text,
  target         text,
  decision       text not null,
  detail         text,
  ip             text,
  correlation_id text
);

create index if not exists audit_log_ts_idx on audit_log (ts desc);
create index if not exists audit_log_actor_idx on audit_log (actor_id);

alter table audit_log enable row level security;
revoke all on audit_log from anon, authenticated;
-- Append-only: writes via service_role only; no update/delete granted to anyone.

-- ---- Harden the RAG corpus too (defense in depth) ----
-- The app reads/writes rag_chunks with the service_role key, which bypasses RLS,
-- so enabling RLS here simply removes any public anon access to the table.
alter table if exists rag_chunks enable row level security;
revoke all on rag_chunks from anon;

notify pgrst, 'reload schema';
