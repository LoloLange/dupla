-- ============================================================
-- Dupla · recurrencias: movimientos que se repiten cada X tiempo
-- semanal (día de semana 0-6) o mensual (día del mes 1-31)
-- ============================================================

alter table public.gastos
  add column if not exists recurrencia_frecuencia text
    check (recurrencia_frecuencia in ('semanal', 'mensual')),
  add column if not exists recurrencia_intervalo integer not null default 1
    check (recurrencia_intervalo >= 1),
  add column if not exists recurrencia_dia_semana integer
    check (recurrencia_dia_semana between 0 and 6),
  add column if not exists recurrencia_dia_mes integer
    check (recurrencia_dia_mes between 1 and 31);

create index if not exists idx_gastos_user_recurrentes
  on public.gastos (user_id) where recurrencia_frecuencia is not null;
