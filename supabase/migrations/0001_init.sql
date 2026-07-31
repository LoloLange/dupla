-- ============================================================
-- Dupla · migración inicial
-- ============================================================

-- Gastos cargados por voz / manualmente
create table if not exists public.gastos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
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
  user_id    uuid not null references auth.users(id) on delete cascade,
  moneda     text not null check (moneda in ('ARS', 'USD')),
  saldo      numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, moneda)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.gastos enable row level security;
alter table public.patrimonio enable row level security;

create policy "gastos_select_own" on public.gastos
  for select using (auth.uid() = user_id);

create policy "gastos_insert_own" on public.gastos
  for insert with check (auth.uid() = user_id);

create policy "gastos_update_own" on public.gastos
  for update using (auth.uid() = user_id);

create policy "gastos_delete_own" on public.gastos
  for delete using (auth.uid() = user_id);

create policy "patrimonio_select_own" on public.patrimonio
  for select using (auth.uid() = user_id);

create policy "patrimonio_insert_own" on public.patrimonio
  for insert with check (auth.uid() = user_id);

create policy "patrimonio_update_own" on public.patrimonio
  for update using (auth.uid() = user_id);

-- Saldo inicial de patrimonio por usuario (opcional, fase 1.5)
create or replace function public.crear_patrimonio_inicial()
returns trigger language plpgsql security definer as $$
begin
  insert into public.patrimonio (user_id, moneda) values (new.id, 'ARS');
  insert into public.patrimonio (user_id, moneda) values (new.id, 'USD');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_patrimonio_inicial();
