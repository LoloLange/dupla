-- ============================================================
-- Dupla · preferencias de usuario (tema visual)
-- 1:1 con public.usuarios. El tema matchea ^[a-z0-9-]+-(light|dark)$
-- ============================================================

create table if not exists public.perfiles (
  user_id    uuid primary key references public.usuarios(id) on delete cascade,
  tema       text not null default 'solar-dusk-dark'
             check (tema ~ '^[a-z0-9-]+-(light|dark)$'),
  updated_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "perfiles_solo_servidor" on public.perfiles;
create policy "perfiles_solo_servidor" on public.perfiles
  for all using (false) with check (false);
