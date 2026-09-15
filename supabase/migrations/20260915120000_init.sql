-- =============================================================================
-- TakeMyCard · esquema inicial
-- Plataforma link-in-bio multi-tenant para tarjetas NFC.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------

-- Plan comercial del perfil. 'basico' usa la plantilla fija de esta plataforma;
-- 'premium' queda reservado para la landing personalizada (fuera de alcance).
do $$ begin
  create type plan_tipo as enum ('basico', 'premium');
exception when duplicate_object then null;
end $$;

-- Tipo de link. Determina el icono, el orden sugerido y --sobre todo-- cómo se
-- construye el href a partir de `valor` (ver lib/links.ts).
do $$ begin
  create type link_tipo as enum (
    'whatsapp',
    'telefono',
    'email',
    'instagram',
    'facebook',
    'linkedin',
    'tiktok',
    'youtube',
    'web',
    'agenda',
    'ubicacion',
    'alias_cbu',
    'otro'
  );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- admin_users: quiénes somos "nosotros" (los dueños del negocio).
-- Se usa una tabla en vez de un custom claim en el JWT para que dar de alta un
-- admin sea un INSERT y no requiera re-emitir tokens.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Usuarios con acceso total al panel de administración.';

-- Helper usado por todas las políticas. SECURITY DEFINER para que la consulta a
-- admin_users no vuelva a pasar por RLS (evita recursión infinita de políticas).
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles: un registro por profesional / por tarjeta NFC.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                       uuid primary key default gen_random_uuid(),

  -- El slug es lo único que la tarjeta NFC conoce: tudominio.com/<slug>.
  -- El chip no se reprograma nunca, así que cambiar un slug rompe las tarjetas
  -- ya entregadas. Ver la nota en docs/SUPABASE.md.
  slug                     text not null unique
                             check (slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$'),

  nombre                   text not null check (length(trim(nombre)) > 0),
  profesion                text,
  bio                      text check (bio is null or length(bio) <= 500),
  foto_url                 text,

  plan                     plan_tipo not null default 'basico',

  -- Habilita, a futuro, que el propio profesional edite su página.
  -- Hoy ningún panel de cliente existe, pero las políticas de RLS ya lo
  -- contemplan para no tener que rehacer la arquitectura después.
  auto_edicion_habilitada  boolean not null default false,

  -- Cuenta de Supabase Auth del profesional. Nullable: en el plan básico el
  -- cliente no tiene login. Sin esta columna la política de auto-edición no
  -- sería expresable (no habría con qué atar la fila a un usuario).
  user_id                  uuid unique references auth.users (id) on delete set null,

  activo                   boolean not null default true,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- El lookup por slug es la consulta caliente: ocurre en cada tap de tarjeta.
create index if not exists profiles_slug_idx    on public.profiles (slug);
create index if not exists profiles_activo_idx  on public.profiles (activo);
create index if not exists profiles_user_id_idx on public.profiles (user_id);

comment on column public.profiles.slug is
  'URL pública del profesional. Grabado en la tarjeta NFC: cambiarlo invalida las tarjetas ya entregadas.';

-- -----------------------------------------------------------------------------
-- links: botones de contacto de cada perfil.
-- -----------------------------------------------------------------------------
create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo       link_tipo not null,
  label      text not null check (length(trim(label)) > 0),

  -- Valor crudo tal como se carga en el panel, NO una URL armada:
  --   whatsapp   -> 2664123456   (la app arma https://wa.me/...)
  --   instagram  -> usuario      (o la URL completa, ambas se aceptan)
  --   web/agenda -> https://...
  --   ubicacion  -> dirección o URL de Google Maps
  --   alias_cbu  -> mi.alias.mp  (no es un link: se renderiza como "copiar")
  -- El href se construye en lib/links.ts según el tipo.
  valor      text not null check (length(trim(valor)) > 0),

  orden      integer not null default 0,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists links_profile_id_orden_idx
  on public.links (profile_id, orden);

comment on column public.links.valor is
  'Valor crudo (teléfono, usuario, alias, URL). El href se deriva del tipo en la app.';

-- -----------------------------------------------------------------------------
-- page_views: analítica mínima de visitas. Opcional, sin datos personales.
-- -----------------------------------------------------------------------------
create table if not exists public.page_views (
  id         bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  referrer   text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_profile_id_created_at_idx
  on public.page_views (profile_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tocar_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles    enable row level security;
alter table public.links       enable row level security;
alter table public.admin_users enable row level security;
alter table public.page_views  enable row level security;

-- --- profiles ----------------------------------------------------------------

-- Lectura pública: SOLO perfiles activos. Un perfil dado de baja deja de ser
-- visible para el mundo aunque la tarjeta NFC siga apuntando a su slug.
drop policy if exists "profiles: lectura publica de activos" on public.profiles;
create policy "profiles: lectura publica de activos"
  on public.profiles for select
  to anon, authenticated
  using (activo = true);

-- El admin ve todo, incluidos los perfiles inactivos (los necesita en el panel).
drop policy if exists "profiles: admin lee todo" on public.profiles;
create policy "profiles: admin lee todo"
  on public.profiles for select
  to authenticated
  using (public.es_admin());

drop policy if exists "profiles: admin escribe" on public.profiles;
create policy "profiles: admin escribe"
  on public.profiles for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Auto-edición del profesional: sólo su propia fila y sólo si el flag está en
-- true. El WITH CHECK repite las condiciones para que no pueda auto-otorgarse
-- el permiso ni robarle la fila a otro usuario cambiando user_id.
drop policy if exists "profiles: profesional edita el suyo" on public.profiles;
create policy "profiles: profesional edita el suyo"
  on public.profiles for update
  to authenticated
  using  (user_id = auth.uid() and auto_edicion_habilitada = true)
  with check (user_id = auth.uid() and auto_edicion_habilitada = true);

-- --- links -------------------------------------------------------------------

-- Los links de un perfil son públicos sólo si el perfil lo es.
drop policy if exists "links: lectura publica de perfiles activos" on public.links;
create policy "links: lectura publica de perfiles activos"
  on public.links for select
  to anon, authenticated
  using (
    activo = true
    and exists (
      select 1 from public.profiles p
      where p.id = links.profile_id and p.activo = true
    )
  );

drop policy if exists "links: admin lee todo" on public.links;
create policy "links: admin lee todo"
  on public.links for select
  to authenticated
  using (public.es_admin());

drop policy if exists "links: admin escribe" on public.links;
create policy "links: admin escribe"
  on public.links for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "links: profesional gestiona los suyos" on public.links;
create policy "links: profesional gestiona los suyos"
  on public.links for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = links.profile_id
        and p.user_id = auth.uid()
        and p.auto_edicion_habilitada = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = links.profile_id
        and p.user_id = auth.uid()
        and p.auto_edicion_habilitada = true
    )
  );

-- --- admin_users -------------------------------------------------------------
-- Nadie escribe acá desde la app: los admins se dan de alta a mano desde el SQL
-- editor de Supabase. Cada admin puede leer su propia fila (para que el panel
-- sepa si mostrar o no la UI) y el admin puede leer la lista completa.

drop policy if exists "admin_users: lee su propia fila" on public.admin_users;
create policy "admin_users: lee su propia fila"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- --- page_views --------------------------------------------------------------
-- Insert-only desde el público: se registra la visita pero nadie puede leer
-- las métricas salvo el admin.

drop policy if exists "page_views: insert publico" on public.page_views;
create policy "page_views: insert publico"
  on public.page_views for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = page_views.profile_id and p.activo = true
    )
  );

drop policy if exists "page_views: admin lee" on public.page_views;
create policy "page_views: admin lee"
  on public.page_views for select
  to authenticated
  using (public.es_admin());

-- =============================================================================
-- Storage: bucket público para las fotos de perfil
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos: lectura publica" on storage.objects;
create policy "fotos: lectura publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos');

drop policy if exists "fotos: admin escribe" on storage.objects;
create policy "fotos: admin escribe"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'fotos' and public.es_admin())
  with check (bucket_id = 'fotos' and public.es_admin());

-- =============================================================================
-- RPC auxiliares
-- =============================================================================

-- Distingue "el slug no existe" de "el perfil está dado de baja" sin exponer
-- los datos del perfil inactivo. Sin esto, RLS devuelve cero filas en ambos
-- casos y la página pública no puede dar un mensaje de error específico.
-- SECURITY DEFINER a propósito: lee por encima de RLS pero sólo devuelve un
-- estado, nunca el contenido de la fila.
create or replace function public.estado_slug(p_slug text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select case when p.activo then 'activo' else 'inactivo' end
       from public.profiles p where p.slug = p_slug),
    'no_existe'
  );
$$;

grant execute on function public.estado_slug(text) to anon, authenticated;
