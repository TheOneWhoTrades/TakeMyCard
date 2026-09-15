\set ON_ERROR_STOP off
\pset pager off

-- Actores de prueba
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111','admin@takemycard.ar'),
  ('22222222-2222-2222-2222-222222222222','lucia@ejemplo.com'),
  ('33333333-3333-3333-3333-333333333333','intruso@ejemplo.com');
insert into public.admin_users (user_id, email) values
  ('11111111-1111-1111-1111-111111111111','admin@takemycard.ar');

-- Un perfil pausado y uno con auto-edición, para probar los bordes
insert into public.profiles (slug, nombre, activo) values ('perfil-pausado','Pausado', false);
update public.profiles
  set user_id='22222222-2222-2222-2222-222222222222', auto_edicion_habilitada=true
  where slug='dra-lucia-fernandez';

\echo '=== ANON ==='
set role anon;
select 'anon ve perfiles activos' as caso, count(*) as filas from public.profiles;
select 'anon NO ve el pausado' as caso, count(*) as filas from public.profiles where slug='perfil-pausado';
select 'anon ve links del activo' as caso, count(*) as filas from public.links;
select 'anon distingue estados' as caso,
       public.estado_slug('dra-lucia-fernandez') as activo,
       public.estado_slug('perfil-pausado')      as pausado,
       public.estado_slug('no-existe-nada')      as inexistente;
\echo '-- anon intenta escribir (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('hackeado','Hacker');
update public.profiles set nombre='Hackeado' where slug='dra-lucia-fernandez';
delete from public.links;
\echo '-- anon intenta leer metricas (debe dar 0 filas) --'
select 'anon lee page_views' as caso, count(*) as filas from public.page_views;
reset role;

\echo ''
\echo '=== PROFESIONAL con auto_edicion_habilitada=true (Lucia) ==='
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio='Editado por la titular' where slug='dra-lucia-fernandez';
select 'lucia edito su bio' as caso, bio from public.profiles where slug='dra-lucia-fernandez';
\echo '-- lucia intenta auto-otorgarse permisos / robar la fila (debe afectar 0) --'
update public.profiles set auto_edicion_habilitada=false where slug='dra-lucia-fernandez';
update public.profiles set user_id='33333333-3333-3333-3333-333333333333' where slug='dra-lucia-fernandez';
\echo '-- lucia gestiona sus links (debe funcionar) --'
insert into public.links (profile_id, tipo, label, valor, orden)
  select id,'web','Mi web nueva','https://nuevo.com',99 from public.profiles where slug='dra-lucia-fernandez';
select 'lucia agrego un link' as caso, count(*) as filas from public.links where label='Mi web nueva';
\echo '-- lucia intenta tocar OTRO perfil (debe afectar 0) --'
update public.profiles set nombre='Robado' where slug='perfil-pausado';
select 'perfil ajeno intacto' as caso, count(*) as filas from public.profiles where nombre='Robado';
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== USUARIO LOGUEADO SIN PERMISOS (intruso) ==='
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'intruso ve solo activos' as caso, count(*) as filas from public.profiles;
update public.profiles set nombre='Robado' where slug='dra-lucia-fernandez';
insert into public.profiles (slug, nombre) values ('intruso-slug','Intruso');
select 'intruso lee admin_users' as caso, count(*) as filas from public.admin_users;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== ADMIN ==='
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'admin ve TODOS (incl. pausados)' as caso, count(*) as filas from public.profiles;
update public.profiles set nombre='Pausado (editado por admin)' where slug='perfil-pausado';
select 'admin edito el pausado' as caso, nombre from public.profiles where slug='perfil-pausado';
insert into public.profiles (slug, nombre) values ('nuevo-cliente','Cliente Nuevo');
select 'admin creo un perfil' as caso, count(*) as filas from public.profiles where slug='nuevo-cliente';
select 'admin lee page_views' as caso, count(*) as filas from public.page_views;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== CONSTRAINTS ==='
\echo '-- slug duplicado (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('dra-lucia-fernandez','Duplicado');
\echo '-- slug con mayusculas/espacios (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('Dra Lucia','Mal Slug');
\echo '-- nombre vacio (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('vacio','   ');
\echo '-- borrado en cascada de links --'
select 'links antes' as caso, count(*) as filas from public.links;
delete from public.profiles where slug='dra-lucia-fernandez';
select 'links despues (cascade)' as caso, count(*) as filas from public.links;

\echo ''
\echo '=== ANALITICA (page_views) ==='
-- El perfil de prueba se borró arriba a propósito (test de cascade): se
-- recrea uno mínimo para probar la política de inserción pública.
insert into public.profiles (slug, nombre, activo) values ('perfil-analitica','Analítica', true);
set role anon;
\echo '-- anon registra visita a perfil ACTIVO (debe funcionar) --'
insert into public.page_views (profile_id) select id from public.profiles where slug='perfil-analitica';
\echo '-- anon registra visita a perfil PAUSADO (debe FALLAR) --'
insert into public.page_views (profile_id) values ((select id from public.profiles where slug='perfil-pausado'));
\echo '-- anon NO puede leer las metricas (debe dar 0 filas) --'
select 'anon lee page_views' as caso, count(*) as filas from public.page_views;
reset role;

set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
select 'admin lee la visita registrada' as caso, count(*) as filas from public.page_views;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== STORAGE ==='
select 'bucket fotos publico' as caso, id, public from storage.buckets;
