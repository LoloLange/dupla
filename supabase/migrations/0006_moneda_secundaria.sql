-- ============================================================
-- Dupla · moneda secundaria del usuario
-- null = sin moneda secundaria (solo balance total en ARS)
-- 'USD' | 'EUR' | 'BRL' | 'CLP' | 'UYU' = la elegida
-- ============================================================

alter table public.perfiles
  add column if not exists moneda_secundaria text
  check (moneda_secundaria is null or moneda_secundaria in ('USD', 'EUR', 'BRL', 'CLP', 'UYU'));
