-- ============================================================
-- Dupla · ingresos: movimientos pasan a ser gasto/ingreso
-- ============================================================

alter table public.gastos
  add column if not exists tipo text not null default 'gasto'
  check (tipo in ('gasto', 'ingreso'));

create index if not exists idx_gastos_user_tipo
  on public.gastos (user_id, tipo);
