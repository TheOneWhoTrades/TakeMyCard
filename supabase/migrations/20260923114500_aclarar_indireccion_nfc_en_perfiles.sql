-- El slug es la URL pública editable. Lo inmutable y grabado en NFC es el
-- código corto, que la resuelve mediante /t/<codigo>.
comment on column public.profiles.slug is
  'URL pública editable del profesional. El chip NFC guarda codigo_corto, por lo que un cambio de slug no invalida tarjetas entregadas.';

create or replace function public.proteger_campos_de_negocio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'El plan sólo lo cambia un administrador.';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'La cuenta vinculada sólo la cambia un administrador.';
  end if;
  if new.slug is distinct from old.slug then
    raise exception 'El slug sólo lo cambia un administrador; la tarjeta sigue resolviendo por su código corto.';
  end if;
  if new.codigo_corto is distinct from old.codigo_corto then
    raise exception 'El código de la tarjeta no se puede cambiar.';
  end if;

  return new;
end;
$$;
