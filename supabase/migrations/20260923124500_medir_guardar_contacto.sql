-- La vCard es el CTA transversal de las tres suscripciones. Medir su toque
-- como acción propia permite validar el piloto sin identificar al visitante ni
-- confundirlo con un link editable del perfil.
alter table public.events add column if not exists accion text;

update public.events
set accion = case when tipo = 'vista' then 'perfil' else 'link' end
where accion is null;

alter table public.events alter column accion set not null;
alter table public.events drop constraint if exists events_accion_valida;
alter table public.events add constraint events_accion_valida check (
  (tipo = 'vista' and accion = 'perfil')
  or (tipo = 'clic' and accion in ('link', 'guardar_contacto'))
);

drop function if exists public.registrar_evento(text, text, uuid, text);
create function public.registrar_evento(
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

  if v_accion = 'link' and p_link_id is not null then
    select l.id into v_link_id
    from public.links l
    where l.id = p_link_id and l.profile_id = v_profile_id;
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
grant execute on function public.registrar_evento(text, text, uuid, text, text) to anon, authenticated;

drop function if exists public.metricas_perfil(uuid, int);
create function public.metricas_perfil(p_profile_id uuid, p_dias int default 30)
returns table (
  categoria text,
  link_id uuid,
  etiqueta text,
  vistas bigint,
  clics bigint
)
language sql
stable
set search_path = ''
as $$
  with rango as (
    select * from public.events e
    where e.profile_id = p_profile_id
      and e.created_at >= now() - make_interval(days => greatest(p_dias, 1))
  ), filas(categoria, link_id, etiqueta, vistas, clics, grupo) as (
    select 'perfil'::text, null::uuid, 'Perfil'::text,
      count(*) filter (where tipo = 'vista'), count(*) filter (where tipo = 'clic'), 0
    from rango
    union all
    select 'guardar_contacto'::text, null::uuid, 'Guardar contacto'::text,
      0::bigint, count(*) filter (where tipo = 'clic' and accion = 'guardar_contacto'), 1
    from rango
    union all
    select 'link'::text, l.id, l.label, 0::bigint, count(r.id), 2
    from public.links l
    left join rango r on r.link_id = l.id and r.tipo = 'clic' and r.accion = 'link'
    where l.profile_id = p_profile_id
    group by l.id, l.label
  )
  select f.categoria, f.link_id, f.etiqueta, f.vistas, f.clics
  from filas f
  order by f.grupo asc, f.clics desc, f.etiqueta asc;
$$;
grant execute on function public.metricas_perfil(uuid, int) to authenticated;
