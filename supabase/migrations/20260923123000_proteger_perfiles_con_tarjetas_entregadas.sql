-- Una tarjeta física sigue circulando aunque el cliente cambie de estado. No
-- permitimos borrar su perfil y perder la resolución del código NFC: el camino
-- operativo es pausarlo. Los perfiles aún sin tarjetas registradas sí se pueden
-- eliminar si fueron creados por error durante el alta.
create or replace function public.impedir_eliminar_perfil_con_tarjetas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.cards tarjeta
    where tarjeta.profile_id = old.id
  ) then
    raise exception
      'No se puede eliminar un perfil con tarjetas físicas registradas; pausalo para conservar la dirección NFC.';
  end if;

  return old;
end;
$$;

drop trigger if exists profiles_impedir_eliminacion_con_tarjetas on public.profiles;
create trigger profiles_impedir_eliminacion_con_tarjetas
  before delete on public.profiles
  for each row execute function public.impedir_eliminar_perfil_con_tarjetas();
