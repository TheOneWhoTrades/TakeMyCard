-- =============================================================================
-- TakeMyCard · los tres planes, el contenido del perfil y la analítica
--
-- Lleva el esquema inicial (que sólo contemplaba básico/premium y una tabla de
-- visitas) al modelo del brief: tres planes, datos de contacto separados de los
-- botones, eventos de vista y de clic, y registro de tarjetas entregadas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- plan: de enum a texto con CHECK
--
-- Agregar un valor a un enum de Postgres no se puede usar en la misma
-- transacción en que se agrega, así que cada plan nuevo obligaba a partir la
-- migración en dos. Con un CHECK sobre texto, sumar un plan es una línea. El
-- enum no daba nada a cambio: la app ya valida los valores.
-- -----------------------------------------------------------------------------
alter table public.profiles alter column plan drop default;
alter table public.profiles alter column plan type text using plan::text;
alter table public.profiles alter column plan set default 'basico';

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('basico', 'plus', 'premium'));

drop type if exists plan_tipo;

comment on column public.profiles.plan is
  'Switch de diseño y de funciones. basico: lo editamos nosotros. plus: el '
  'cliente se autoedita y tiene portada. premium: además, analítica y layout propio.';

-- -----------------------------------------------------------------------------
-- El plan es el único switch
--
-- `auto_edicion_habilitada` era un segundo interruptor que decía lo mismo que
-- el plan y podía contradecirlo (un premium con el flag en false quedaba sin
-- panel sin que nada lo explicara). Se elimina: quién puede autoeditarse sale
-- del plan, como dice el brief.
-- -----------------------------------------------------------------------------
-- Las políticas viejas mencionan la columna, así que hay que sacarlas antes de
-- poder borrarla. Se vuelven a crear más abajo, atadas al plan.
drop policy if exists "profiles: profesional edita el suyo" on public.profiles;
drop policy if exists "links: profesional gestiona los suyos" on public.links;

alter table public.profiles drop column if exists auto_edicion_habilitada;

-- -----------------------------------------------------------------------------
-- Contenido nuevo del perfil
-- -----------------------------------------------------------------------------

-- Paleta de color de la tarjeta digital. Las seis viven en lib/paletas.ts;
-- acá sólo se valida que el valor sea una de ellas.
alter table public.profiles add column if not exists paleta text not null default 'bosque';
alter table public.profiles drop constraint if exists profiles_paleta_check;
alter table public.profiles add constraint profiles_paleta_check
  check (paleta in ('bosque', 'oliva', 'tierra', 'roble', 'salvia', 'tabaco'));

-- Foto de portada tipo LinkedIn. Sólo se muestra en plus y premium; la columna
-- existe para todos para que subir de plan no pierda lo ya cargado.
alter table public.profiles add column if not exists portada_url text;

-- Variante de diseño de la landing premium. 'estandar' es la plantilla común;
-- las demás son los layouts propios del premium.
alter table public.profiles add column if not exists layout text not null default 'estandar';
alter table public.profiles drop constraint if exists profiles_layout_check;
alter table public.profiles add constraint profiles_layout_check
  check (layout in ('estandar', 'editorial', 'retrato', 'vidriera'));

-- -----------------------------------------------------------------------------
-- Enlace corto: lo que se graba en el chip
--
-- El brief lo marca como importante: el chip NFC no se reprograma, así que no
-- puede apuntar al render final. Apunta a /t/<codigo>, que redirige al perfil.
-- Si mañana cambia el dominio o la estructura de URLs, se cambia la redirección
-- y las tarjetas ya entregadas siguen funcionando.
--
-- El código es independiente del slug a propósito: el slug puede cambiar (el
-- cliente se casa, cambia de profesión); el código no cambia nunca.
-- -----------------------------------------------------------------------------
create or replace function public.generar_codigo_corto()
returns text
language sql
volatile
as $$
  -- Alfabeto sin 0/O ni 1/I/l: el código se dicta por teléfono y se imprime
  -- chico al dorso de la tarjeta, así que no puede tener pares confundibles.
  select string_agg(
    substr('23456789abcdefghjkmnpqrstuvwxyz', floor(random() * 31)::int + 1, 1),
    ''
  )
  from generate_series(1, 7);
$$;

alter table public.profiles add column if not exists codigo_corto text;

update public.profiles set codigo_corto = public.generar_codigo_corto()
where codigo_corto is null;

alter table public.profiles alter column codigo_corto set default public.generar_codigo_corto();
alter table public.profiles alter column codigo_corto set not null;

create unique index if not exists profiles_codigo_corto_idx on public.profiles (codigo_corto);

comment on column public.profiles.codigo_corto is
  'Lo que se graba en el chip NFC: /t/<codigo_corto>. No cambia nunca, ni aunque cambie el slug.';

-- -----------------------------------------------------------------------------
-- contact_info: los datos que van a la agenda del teléfono
--
-- Van separados de `links` porque no son lo mismo: un link es un botón que el
-- visitante toca; esto es lo que se guarda en el contacto. Hoy se solapan
-- bastante, pero separarlos permite tener un teléfono en la vCard que no
-- aparezca como botón, y al revés.
-- -----------------------------------------------------------------------------
create table if not exists public.contact_info (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  telefono   text,
  email      text,
  direccion  text,
  -- { "instagram": "usuario", "linkedin": "in/usuario", ... }
  redes      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contact_info is
  'Datos de contacto del profesional para la vCard. Son públicos por diseño: es '
  'la información que él mismo reparte en su tarjeta.';

drop trigger if exists contact_info_set_updated_at on public.contact_info;
create trigger contact_info_set_updated_at
  before update on public.contact_info
  for each row execute function public.tocar_updated_at();

-- -----------------------------------------------------------------------------
-- events: analítica sin visitante
--
-- Reemplaza a page_views, que sólo contaba vistas. Guarda vistas y clics para
-- TODOS los planes --así, si alguien sube a premium, tiene historial desde el
-- día uno-- pero sólo el premium ve el panel.
--
-- Lo que NO se guarda, a propósito y por escrito: IP, user-agent, cookie,
-- identificador de dispositivo, ni nada que permita reconocer a un visitante
-- entre dos visitas. De `referrer` se guarda sólo el dominio (ver
-- registrar_evento), nunca la URL completa: la URL de origen puede llevar el
-- término buscado o un identificador de sesión del sitio que enlaza.
--
-- La consecuencia de esto es que no hay "visitantes únicos", sólo totales. Es
-- el precio de no rastrear a nadie, y está elegido así.
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id         bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo       text not null check (tipo in ('vista', 'clic')),
  -- Sólo en los clics, y sólo si el botón todavía existe.
  link_id    uuid references public.links (id) on delete set null,
  -- Dominio de origen, sin ruta ni query. NULL si la visita fue directa
  -- (el caso normal: alguien acercó la tarjeta al teléfono).
  referrer   text,
  created_at timestamptz not null default now()
);

create index if not exists events_profile_created_idx
  on public.events (profile_id, created_at desc);
create index if not exists events_profile_tipo_idx
  on public.events (profile_id, tipo);

-- Las visitas ya registradas se conservan: son el historial del piloto.
insert into public.events (profile_id, tipo, referrer, created_at)
select profile_id, 'vista', referrer, created_at from public.page_views;

drop table if exists public.page_views;

-- -----------------------------------------------------------------------------
-- cards: las tarjetas físicas entregadas
--
-- Es registro interno nuestro (stock y reposiciones), nunca se muestra en la
-- página pública.
-- -----------------------------------------------------------------------------
create table if not exists public.cards (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  entregada_el date,
  -- false = una de las dos que incluye el plan; true = repuesto vendido aparte.
  reposicion   boolean not null default false,
  nota         text,
  created_at   timestamptz not null default now()
);

create index if not exists cards_profile_idx on public.cards (profile_id);

-- =============================================================================
-- Row Level Security de lo nuevo
-- =============================================================================

alter table public.contact_info enable row level security;
alter table public.events       enable row level security;
alter table public.cards        enable row level security;

-- Helper: ¿esta fila es del profesional logueado, y su plan le permite editarla?
-- SECURITY DEFINER para que no vuelva a pasar por las políticas de profiles.
create or replace function public.puede_autoeditar(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and p.user_id = auth.uid()
      and p.plan in ('plus', 'premium')
  );
$$;

-- --- contact_info -------------------------------------------------------------
-- Público si el perfil está activo: es el contenido de la vCard.

drop policy if exists "contact_info: lectura publica de activos" on public.contact_info;
create policy "contact_info: lectura publica de activos"
  on public.contact_info for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = contact_info.profile_id and p.activo = true
    )
  );

drop policy if exists "contact_info: admin escribe" on public.contact_info;
create policy "contact_info: admin escribe"
  on public.contact_info for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "contact_info: profesional gestiona el suyo" on public.contact_info;
create policy "contact_info: profesional gestiona el suyo"
  on public.contact_info for all
  to authenticated
  using (public.puede_autoeditar(profile_id))
  with check (public.puede_autoeditar(profile_id));

-- --- events -------------------------------------------------------------------
-- NO hay política de INSERT: nadie escribe acá directamente. La única vía es
-- registrar_evento(), que valida y normaliza. Así un visitante no puede
-- inventarse eventos de otro perfil ni guardar texto arbitrario en `referrer`.

drop policy if exists "events: admin lee" on public.events;
create policy "events: admin lee"
  on public.events for select
  to authenticated
  using (public.es_admin());

-- El profesional ve sus métricas sólo si es premium. Los eventos se guardan
-- igual en los otros planes, pero no se los devolvemos: el panel de
-- estadísticas es lo que se paga en premium, y la regla vive en la base y no
-- sólo en la interfaz.
drop policy if exists "events: premium lee los suyos" on public.events;
create policy "events: premium lee los suyos"
  on public.events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = events.profile_id
        and p.user_id = auth.uid()
        and p.plan = 'premium'
    )
  );

-- --- cards --------------------------------------------------------------------
-- Sólo nosotros. El cliente no tiene por qué ver el registro de stock.

drop policy if exists "cards: admin gestiona" on public.cards;
create policy "cards: admin gestiona"
  on public.cards for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- --- profiles y links: autoedición por plan -----------------------------------
-- Se reescriben las políticas que dependían de auto_edicion_habilitada.

drop policy if exists "profiles: profesional edita el suyo" on public.profiles;
create policy "profiles: profesional edita el suyo"
  on public.profiles for update
  to authenticated
  using  (user_id = auth.uid() and plan in ('plus', 'premium'))
  -- Repetir la condición en WITH CHECK no es redundante: sin esto, el cliente
  -- podría cambiar su propio `plan` a premium o mover `user_id` a otra cuenta.
  with check (user_id = auth.uid() and plan in ('plus', 'premium'));

-- El titular ve su propio perfil aunque esté pausado. Sin esto, un cliente al
-- que le pausamos la página por falta de pago entra al panel y no encuentra
-- nada: la lectura pública sólo devuelve activos.
drop policy if exists "profiles: profesional lee el suyo" on public.profiles;
create policy "profiles: profesional lee el suyo"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

-- Lo mismo para sus links y sus datos de contacto.
drop policy if exists "links: profesional lee los suyos" on public.links;
create policy "links: profesional lee los suyos"
  on public.links for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = links.profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "contact_info: profesional lee el suyo" on public.contact_info;
create policy "contact_info: profesional lee el suyo"
  on public.contact_info for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = contact_info.profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "links: profesional gestiona los suyos" on public.links;
create policy "links: profesional gestiona los suyos"
  on public.links for all
  to authenticated
  using (public.puede_autoeditar(profile_id))
  with check (public.puede_autoeditar(profile_id));

-- El cliente no puede cambiar su plan ni apropiarse de otro perfil. La política
-- de arriba ya lo impide, pero un trigger lo deja explícito y protege también a
-- cualquier camino futuro (una función SECURITY DEFINER mal escrita, por
-- ejemplo) que no pase por RLS.
create or replace function public.proteger_campos_de_negocio()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- `auth.uid()` es null cuando la escritura no viene de un usuario logueado:
  -- una migración, el editor SQL de Supabase o la clave de servicio. Esos
  -- caminos ya se saltean RLS por definición, así que el trigger no tiene por
  -- qué ser más estricto que las políticas: si lo fuera, ni siquiera podríamos
  -- corregir un plan a mano desde el panel de Supabase.
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
    raise exception 'El slug sólo lo cambia un administrador: cambiarlo rompe las tarjetas entregadas.';
  end if;
  if new.codigo_corto is distinct from old.codigo_corto then
    raise exception 'El código de la tarjeta no se puede cambiar.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_proteger_campos on public.profiles;
create trigger profiles_proteger_campos
  before update on public.profiles
  for each row execute function public.proteger_campos_de_negocio();

-- Cast a uuid que no explota. `split_part(name,'/',1)::uuid` falla con error
-- --no con false-- cuando el archivo no está en una carpeta con forma de uuid,
-- y un error dentro de una política de RLS aborta la operación entera en vez de
-- limitarse a denegarla.
create or replace function public.uuid_o_null(p_texto text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_texto::uuid;
exception when others then
  return null;
end;
$$;

-- =============================================================================
-- RPC
-- =============================================================================

-- Resuelve el código corto de una tarjeta al slug actual del perfil.
-- SECURITY DEFINER: tiene que encontrar también los perfiles pausados, para que
-- la redirección lleve al aviso de "tarjeta pausada" en vez de a un 404 seco.
create or replace function public.slug_por_codigo(p_codigo text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.slug from public.profiles p where p.codigo_corto = lower(trim(p_codigo));
$$;

grant execute on function public.slug_por_codigo(text) to anon, authenticated;

-- Registra una vista o un clic.
--
-- Es la única puerta de escritura a `events`. SECURITY DEFINER para poder
-- insertar sin darle permiso de INSERT al público, lo que evita que alguien
-- con la anon key --que es pública por diseño-- escriba filas a mano.
--
-- Todo lo que entra se valida o se descarta:
--   · el perfil tiene que existir y estar activo;
--   · el link tiene que pertenecer a ese perfil (si no, se guarda sin link);
--   · del referrer se conserva sólo el host, recortado.
-- Nunca se guarda la IP ni el user-agent: no se los pasa, y acá no se los lee.
create or replace function public.registrar_evento(
  p_slug     text,
  p_tipo     text,
  p_link_id  uuid default null,
  p_referrer text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
  v_link_id    uuid;
  v_host       text;
begin
  if p_tipo not in ('vista', 'clic') then
    return;
  end if;

  select id into v_profile_id
  from public.profiles
  where slug = p_slug and activo = true;

  if v_profile_id is null then
    return;
  end if;

  if p_link_id is not null then
    select l.id into v_link_id
    from public.links l
    where l.id = p_link_id and l.profile_id = v_profile_id;
  end if;

  -- Sólo el host: se saca el esquema, y todo lo que venga después de la
  -- primera barra, el ? o el #. Una URL de búsqueda lleva el término buscado;
  -- una de una intranet puede llevar un identificador de sesión.
  if p_referrer is not null and length(trim(p_referrer)) > 0 then
    v_host := lower(regexp_replace(trim(p_referrer), '^[a-z]+://', '', 'i'));
    v_host := split_part(split_part(split_part(v_host, '/', 1), '?', 1), '#', 1);
    v_host := regexp_replace(v_host, ':[0-9]+$', '');
    -- Si no parece un dominio, se descarta en vez de guardarlo por las dudas.
    if v_host !~ '^[a-z0-9.-]{3,80}$' or v_host !~ '\.' then
      v_host := null;
    end if;
  end if;

  insert into public.events (profile_id, tipo, link_id, referrer)
  values (v_profile_id, p_tipo, v_link_id, v_host);
end;
$$;

grant execute on function public.registrar_evento(text, text, uuid, text) to anon, authenticated;

-- Vincula un perfil con la cuenta de un cliente, buscándola por email.
--
-- Hace falta porque el panel usa la clave pública y no la de servicio: desde la
-- app no se puede leer `auth.users`, así que no hay forma de averiguar el id de
-- un usuario a partir de su mail. Esta función lo hace de forma acotada --sólo
-- para un admin, sólo para escribir `user_id`-- en vez de darle a la aplicación
-- una clave que se saltea RLS entera.
--
-- La cuenta tiene que existir de antes: se crea invitando al cliente desde el
-- panel de Supabase (Authentication → Users → Invite). Ver docs/SUPABASE.md.
create or replace function public.vincular_cuenta(p_profile_id uuid, p_email text)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Sólo un administrador puede vincular cuentas.';
  end if;

  if p_email is null or trim(p_email) = '' then
    -- Desvincular: el perfil queda sin cuenta asociada y el cliente pierde el
    -- acceso al panel. Se usa al dar de baja o al cambiar de titular.
    update public.profiles set user_id = null where id = p_profile_id;
    return 'desvinculado';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception 'No existe una cuenta con el email %. Invitala primero desde Supabase → Authentication → Users.', p_email;
  end if;

  update public.profiles set user_id = v_user_id where id = p_profile_id;
  return 'vinculado';
end;
$$;

grant execute on function public.vincular_cuenta(uuid, text) to authenticated;

-- Métricas de un perfil, agregadas en la base.
--
-- SECURITY INVOKER (el default) a propósito: la función lee `events` con los
-- permisos de quien llama, así que las políticas de arriba siguen valiendo y
-- nadie puede pedir las métricas de un perfil ajeno por esta vía.
create or replace function public.metricas_perfil(p_profile_id uuid, p_dias int default 30)
returns table (
  link_id  uuid,
  etiqueta text,
  vistas   bigint,
  clics    bigint
)
language sql
stable
set search_path = public, pg_temp
as $$
  with rango as (
    select * from public.events e
    where e.profile_id = p_profile_id
      and e.created_at >= now() - make_interval(days => greatest(p_dias, 1))
  ),
  filas as (
    -- Primera fila: el total del perfil, con link_id nulo.
    select
      null::uuid  as link_id,
      'Perfil'::text as etiqueta,
      count(*) filter (where tipo = 'vista') as vistas,
      count(*) filter (where tipo = 'clic')  as clics,
      0 as grupo
    from rango
    union all
    -- Después, un renglón por botón, del más clicado al menos. Se listan todos
    -- los botones, también los que tienen cero: saber cuál no lo toca nadie es
    -- justamente para lo que sirve el ranking.
    select
      l.id,
      l.label,
      0::bigint,
      count(r.id),
      1
    from public.links l
    left join rango r on r.link_id = l.id and r.tipo = 'clic'
    where l.profile_id = p_profile_id
    group by l.id, l.label
  )
  select f.link_id, f.etiqueta, f.vistas, f.clics
  from filas f
  order by f.grupo asc, f.clics desc, f.etiqueta asc;
$$;

grant execute on function public.metricas_perfil(uuid, int) to authenticated;

-- =============================================================================
-- Storage: que el cliente pueda subir sus propias fotos
--
-- Las fotos se guardan en fotos/<profile_id>/<archivo>. La política ata la
-- carpeta al perfil: un cliente de plus o premium escribe dentro de la suya y
-- en ninguna otra.
-- =============================================================================

-- El bucket `fotos` es público: las imágenes se sirven por
-- /storage/v1/object/public/..., que no pasa por RLS. Por eso la política de
-- lectura para `anon` no hace falta para mostrar las fotos, y sí habilitaba
-- algo que no queremos: listar el contenido del bucket por la API y enumerar
-- así las fotos de todos los perfiles, incluidos los pausados. Se quita.
drop policy if exists "fotos: lectura publica" on storage.objects;

drop policy if exists "fotos: lectura autenticada" on storage.objects;
create policy "fotos: lectura autenticada"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fotos'
    and (
      public.es_admin()
      or public.puede_autoeditar(public.uuid_o_null(split_part(name, '/', 1)))
    )
  );

drop policy if exists "fotos: profesional escribe en su carpeta" on storage.objects;
create policy "fotos: profesional escribe en su carpeta"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'fotos'
    and public.puede_autoeditar(public.uuid_o_null(split_part(name, '/', 1)))
  )
  with check (
    bucket_id = 'fotos'
    and public.puede_autoeditar(public.uuid_o_null(split_part(name, '/', 1)))
  );
