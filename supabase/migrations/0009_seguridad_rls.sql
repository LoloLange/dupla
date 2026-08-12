-- ============================================================
-- Dupla · seguridad y RLS: modo "solo servidor"
-- ============================================================
-- La app usa auth propia (public.usuarios) y cookies httpOnly; el
-- cliente nunca toca Supabase. Todo dato pasa por API routes con el
-- service role, que bypasea RLS. Por eso:
--   1) La función de trigger pasa a security invoker con search_path
--      fijo, y se le quita EXECUTE a los roles de cliente.
--   2) Se revocan TODOS los privilegios de anon/authenticated sobre
--      tablas y funciones de public (actuales y futuras).
--   3) Las policies se reemplazan por denegaciones explícitas
--      ("solo servidor"), ya que auth.uid() siempre es null con
--      usuarios fuera de auth.users.

-- 1) Función de trigger: security invoker + search_path fijo.
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

revoke execute on function public.crear_patrimonio_inicial() from public, anon, authenticated;
grant execute on function public.crear_patrimonio_inicial() to service_role;

-- 2) Privilegios de cliente revocados (tablas y funciones, actuales y futuras).
revoke all on table public.usuarios, public.sesiones, public.gastos,
  public.patrimonio, public.perfiles from anon, authenticated;

alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

-- 3) Policies de denegación explícita en todas las tablas.
-- Se limpian las policies viejas basadas en auth.uid() (siempre false).

drop policy if exists "gastos_select_own" on public.gastos;
drop policy if exists "gastos_insert_own" on public.gastos;
drop policy if exists "gastos_update_own" on public.gastos;
drop policy if exists "gastos_delete_own" on public.gastos;
drop policy if exists "patrimonio_select_own" on public.patrimonio;
drop policy if exists "patrimonio_insert_own" on public.patrimonio;
drop policy if exists "patrimonio_update_own" on public.patrimonio;
drop policy if exists "perfiles_select_own" on public.perfiles;
drop policy if exists "perfiles_insert_own" on public.perfiles;
drop policy if exists "perfiles_update_own" on public.perfiles;

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

drop policy if exists "perfiles_solo_servidor" on public.perfiles;
create policy "perfiles_solo_servidor" on public.perfiles
  for all using (false) with check (false);
