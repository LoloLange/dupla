-- ============================================================
-- Dupla · tags y comentarios: organización de los movimientos
-- tags: etiquetas cortas (array), comentario: nota libre
-- ============================================================

alter table public.gastos
  add column if not exists tags text[] not null default '{}',
  add column if not exists comentario text;

create index if not exists idx_gastos_user_tags
  on public.gastos using gin (tags);
