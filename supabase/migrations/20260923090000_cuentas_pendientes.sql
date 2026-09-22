-- =============================================================================
-- TakeMyCard · cuentas pendientes de vincular
--
-- El cliente ahora puede crearse la cuenta solo desde /crear-cuenta. Crearla no
-- le da acceso a nada: una cuenta sin perfil vinculado no puede leer ni escribir
-- una sola fila, porque todas las políticas de RLS parten de
-- `profiles.user_id = auth.uid()`. El alta real --vincular esa cuenta con un
-- perfil y asignarle plan-- la seguimos haciendo nosotros desde el backoffice.
--
-- Esta función es lo que hacía falta para ese paso: listar las cuentas que
-- todavía no tienen perfil, para no depender de que el cliente nos dicte el
-- email por WhatsApp y de que nosotros lo tipeemos bien.
-- =============================================================================

create or replace function public.cuentas_sin_perfil()
returns table (user_id uuid, email text, creada_el timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- SECURITY DEFINER para poder leer `auth.users`, que de otro modo es
  -- inalcanzable con la clave pública. Por eso mismo el chequeo de admin va
  -- explícito y primero: sin él, esta función sería una lista de emails de
  -- clientes abierta a cualquiera que sepa invocarla.
  if not public.es_admin() then
    raise exception 'Sólo un administrador puede ver las cuentas pendientes.';
  end if;

  return query
    select u.id, u.email::text, u.created_at
    from auth.users u
    where not exists (select 1 from public.profiles p where p.user_id = u.id)
      -- Nuestras propias cuentas de administración no son clientes pendientes.
      and not exists (select 1 from public.admin_users a where a.user_id = u.id)
    order by u.created_at desc
    -- Cota de seguridad: si algún día alguien abusa del alta pública, el panel
    -- muestra las últimas y no intenta renderizar diez mil filas.
    limit 200;
end;
$$;

grant execute on function public.cuentas_sin_perfil() to authenticated;
