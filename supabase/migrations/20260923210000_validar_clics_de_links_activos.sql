-- =============================================================================
-- Métricas: un clic de botón sólo existe si el botón estaba publicado.
--
-- La API pública no tiene que poder convertir un UUID inventado, ajeno o de un
-- link pausado en un clic agregado sin destino. Además de ensuciar el total,
-- eso hacía menos útil la métrica para el profesional.
-- =============================================================================

create or replace function public.registrar_evento(
  p_slug     text,
  p_tipo     text,
  p_link_id  uuid default null,
  p_referrer text default null,
  p_accion   text default 'link'
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_link_id uuid;
  v_host text;
  v_accion text;
begin
  if p_tipo not in ('vista', 'clic') then return; end if;

  v_accion := case when p_tipo = 'vista' then 'perfil' else p_accion end;
  if v_accion not in ('perfil', 'link', 'guardar_contacto') then return; end if;

  select id into v_profile_id
  from public.profiles
  where slug = p_slug and activo = true;
  if v_profile_id is null then return; end if;

  if v_accion = 'link' then
    -- Un clic de link sin un ID válido no representa una acción del visitante
    -- sobre la tarjeta; se descarta, igual que un link ajeno o pausado.
    if p_link_id is null then return; end if;

    select l.id into v_link_id
    from public.links l
    where l.id = p_link_id
      and l.profile_id = v_profile_id
      and l.activo = true;
    if v_link_id is null then return; end if;
  end if;

  if p_referrer is not null and length(trim(p_referrer)) > 0 then
    v_host := lower(regexp_replace(trim(p_referrer), '^[a-z]+://', '', 'i'));
    v_host := split_part(split_part(split_part(v_host, '/', 1), '?', 1), '#', 1);
    v_host := regexp_replace(v_host, ':[0-9]+$', '');
    if v_host !~ '^[a-z0-9.-]{3,80}$' or v_host !~ '\.' then v_host := null; end if;
  end if;

  insert into public.events (profile_id, tipo, accion, link_id, referrer)
  values (v_profile_id, p_tipo, v_accion, v_link_id, v_host);
end;
$$;

grant execute on function public.registrar_evento(text, text, uuid, text, text)
  to anon, authenticated;
