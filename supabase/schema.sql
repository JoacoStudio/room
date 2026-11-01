-- Supabase schema for Room notes sync
-- Run this in the Supabase SQL editor

-- Enable uuid extension if not already enabled
create extension if not exists "uuid-ossp";

-- Table: notes
-- Stores encrypted notes per user. RLS ensures users only access their own notes.
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  encrypted_body text not null,
  encrypted_title text default '',
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  device_id text
);

-- Enable Row Level Security
alter table public.notes enable row level security;

-- Policy: users can only see their own notes
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

-- Policy: users can insert their own notes
create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

-- Policy: users can update their own notes
create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

-- Policy: users can delete their own notes
create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Index for faster queries by user and updated_at
create index if not exists idx_notes_user_id_updated_at
  on public.notes(user_id, updated_at desc);

-- Index for faster queries by device_id
create index if not exists idx_notes_device_id
  on public.notes(device_id);

-- Grant access to authenticated role
grant all on public.notes to authenticated;
