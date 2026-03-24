-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste & run

create table if not exists experiment_results (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null unique,
  variant_assigned text not null check (variant_assigned in ('A', 'B')),
  highest_step_reached integer not null default 1 check (highest_step_reached between 1 and 5),
  free_text_answer text,
  multiple_choice_answer text,
  created_at       timestamptz not null default now()
);

-- Optional: enable Row Level Security and allow anonymous inserts/updates
-- (your anon key needs INSERT + UPDATE on this table)
alter table experiment_results enable row level security;

create policy "Allow anon insert"
  on experiment_results for insert
  with check (true);

create policy "Allow anon update own row"
  on experiment_results for update
  using (true);

create policy "Allow anon select" -- remove if you want results private
  on experiment_results for select
  using (true);
