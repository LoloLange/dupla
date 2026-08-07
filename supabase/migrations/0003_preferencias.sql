-- ============================================================
-- Dupla · preferencias de usuario (tema visual)
-- 1:1 con auth.users. El tema matchea ^[a-z0-9-]+-(light|dark)$
-- ============================================================

create table if not exists public.perfiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  tema       text not null default 'solar-dusk-dark'
             check (tema ~ '^[a-z0-9-]+-(light|dark)$'),
  updated_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "perfiles_select_own" on public.perfiles
  for select using (auth.uid() = user_id);

create policy "perfiles_insert_own" on public.perfiles
  for insert with check (auth.uid() = user_id);

create policy "perfiles_update_own" on public.perfiles
  for update using (auth.uid() = user_id);
