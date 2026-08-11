-- Los movimientos ahora se guardan en la moneda original de la frase
-- (pesos, dólares, euros, reales, pesos chilenos o uruguayos).
-- La conversión a pesos y a la moneda secundaria se hace al mostrar.

alter table public.gastos
  drop constraint if exists gastos_moneda_check;

alter table public.gastos
  add constraint gastos_moneda_check
  check (moneda in ('ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'));
