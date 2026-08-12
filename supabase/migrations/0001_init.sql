-- ============================================================
-- Dupla · migración inicial
-- ============================================================
-- Auth propio: los usuarios viven en public.usuarios (no en auth.users).
-- Todo acceso a datos pasa por API routes que usan el service role
-- (bypasea RLS). Las policies son de denegación explícita: ningún rol
-- de cliente (anon/authenticated) puede leer ni escribir.

-- Usuarios de la app (email/password con scrypt + Google OAuth)
create table if not exists public.usuarios (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text,
  google_sub    text unique,
  nombre        text,
  foto_url      text,
  creado_en     timestamptz not null default now()
);

-- Sesiones por token (cookie httpOnly, lib/auth.ts)
create table if not exists public.sesiones (
  token      text primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  expira_en  timestamptz not null,
  creado_en  timestamptz not null default now()
);

-- Movimientos (gasto / ingreso). El tipo llega en la migración 0002.
create table if not exists public.gastos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.usuarios(id) on delete cascade,
  monto       numeric(12,2) not null check (monto > 0),
  moneda      text not null check (moneda in ('ARS', 'USD')),
  categoria   text not null,
  descripcion text,
  fecha       timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_gastos_user_fecha
  on public.gastos (user_id, fecha desc);

-- Patrimonio: saldo en mano por moneda
create table if not exists public.patrimonio (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.usuarios(id) on delete cascade,
  moneda     text not null check (moneda in ('ARS', 'USD')),
  saldo      numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, moneda)
);

-- ============================================================
-- Row Level Security (modo "solo servidor")
-- ============================================================
alter table public.usuarios enable row level security;
alter table public.sesiones enable row level security;
alter table public.gastos enable row level security;
alter table public.patrimonio enable row level security;

drop policy if exists "usuarios_solo_servidor" on public.usuarios;
create policy "usuarios_solo_servidor" on public.usuarios
  for all using (false) with check (false);

drop policy if exists "sesiones_solo_servidor" on public.sesiones;
create policy "sesiones_solo_servidor" on public.sesiones
  for all using (false) with check (false);

drop policy if exists "gastos_solo_servidor" on public.gastos;
create policy "gastos_solo_servidor" on public.gastos
  for all using (false) with check (false);

drop policy if exists "patrimonio_solo_servidor" on public.patrimonio;
create policy "patrimonio_solo_servidor" on public.patrimonio
  for all using (false) with check (false);

-- Saldo inicial de patrimonio por usuario (trigger sobre public.usuarios)
create or replace function public.crear_patrimonio_inicial()
returns trigger language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.patrimonio (user_id, moneda) values (new.id, 'ARS');
  insert into public.patrimonio (user_id, moneda) values (new.id, 'USD');
  return new;
end;
$$;

drop trigger if exists on_usuario_creado on public.usuarios;
create trigger on_usuario_creado
  after insert on public.usuarios
  for each row execute function public.crear_patrimonio_inicial();
