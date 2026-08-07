-- Execute este arquivo no SQL Editor do Supabase.
create table if not exists public.journal_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null check (day between 1 and 40),
  reflection text not null default '',
  mass_intention text not null default '',
  purpose text not null default '',
  rosary_note text not null default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.preparation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prayer_requests text not null default '',
  penances text not null default '',
  improvements text not null default '',
  general_purpose text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;
alter table public.preparation enable row level security;

create policy "journal_select_own" on public.journal_entries for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_delete_own" on public.journal_entries for delete using (auth.uid() = user_id);

create policy "prep_select_own" on public.preparation for select using (auth.uid() = user_id);
create policy "prep_insert_own" on public.preparation for insert with check (auth.uid() = user_id);
create policy "prep_update_own" on public.preparation for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "prep_delete_own" on public.preparation for delete using (auth.uid() = user_id);
