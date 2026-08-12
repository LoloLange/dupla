-- ============================================================
-- Dupla · vista del balance: toggles por usuario
-- ver_detalle_monedas: tarjetas de detalle por moneda
-- ver_balance: balance total combinado en pesos
-- ============================================================

alter table public.perfiles
  add column if not exists ver_detalle_monedas boolean not null default true,
  add column if not exists ver_balance boolean not null default true;
