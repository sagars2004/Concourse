-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor) to create tables for Concourse.

-- Sessions: one per user/browser session (id = client-generated UUID from localStorage)
create table if not exists public.sessions (
  id uuid primary key,
  flight_number text,
  gate text,
  terminal text,
  created_at timestamptz default now()
);

-- Preferences: dietary tags per session
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  dietary_tags text[] not null default array['none'],
  updated_at timestamptz default now(),
  unique(session_id)
);

-- Optional: RLS (Row Level Security). For server-side only access with service role, RLS can be disabled.
alter table public.sessions enable row level security;
alter table public.preferences enable row level security;

-- Allow service role full access (used by API routes)
create policy "Service role full access on sessions"
  on public.sessions for all
  using (true)
  with check (true);

create policy "Service role full access on preferences"
  on public.preferences for all
  using (true)
  with check (true);
