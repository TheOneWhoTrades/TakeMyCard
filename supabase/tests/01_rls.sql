\set ON_ERROR_STOP off
\pset pager off

-- =============================================================================
-- Verificación de las políticas de seguridad.
--
-- Los ERROR que aparecen en la salida son ESPERADOS: son los intentos de
-- escritura que las políticas tienen que rechazar. Cada bloque dice qué se
-- espera de él.
-- =============================================================================

-- Actores de prueba
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111','admin@takemycard.ar'),
  ('22222222-2222-2222-2222-222222222222','cliente-premium@ejemplo.com'),
  ('33333333-3333-3333-3333-333333333333','intruso@ejemplo.com'),
  ('44444444-4444-4444-4444-444444444444','cliente-basico@ejemplo.com');
insert into public.admin_users (user_id, email) values
  ('11111111-1111-1111-1111-111111111111','admin@takemycard.ar');

-- Un perfil pausado, uno básico con cuenta, y el demo (premium) como titular.
insert into public.profiles (slug, nombre, activo) values ('perfil-pausado','Pausado', false);
insert into public.profiles (slug, nombre, plan, user_id)
  values ('cliente-basico','Básico','basico','44444444-4444-4444-4444-444444444444');
update public.profiles
  set user_id='22222222-2222-2222-2222-222222222222'
  where slug='estudio-demo';

\echo ''
\echo '=== CODIGO CORTO ==='
select 'todos los perfiles tienen codigo' as caso,
       count(*) filter (where codigo_corto is not null) as con_codigo,
       count(*) as total
from public.profiles;
select 'codigos unicos' as caso, count(distinct codigo_corto) = count(*) as ok from public.profiles;

\echo ''
\echo '=== ANON (el visitante de una tarjeta) ==='
set role anon;
select 'anon ve perfiles activos' as caso, count(*) as filas from public.profiles;
select 'anon NO ve el pausado' as caso, count(*) as filas from public.profiles where slug='perfil-pausado';
select 'anon ve links del activo' as caso, count(*) as filas from public.links;
select 'anon ve contact_info del activo' as caso, count(*) as filas from public.contact_info;
select 'anon distingue estados' as caso,
       public.estado_slug('estudio-demo')   as activo,
       public.estado_slug('perfil-pausado') as pausado,
       public.estado_slug('no-existe-nada') as inexistente;
select 'anon resuelve el codigo corto' as caso,
       public.slug_por_codigo((select codigo_corto from public.profiles where slug='estudio-demo')) as slug;

\echo '-- anon intenta escribir perfiles y links (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('hackeado','Hacker');
update public.profiles set nombre='Hackeado' where slug='estudio-demo';
delete from public.links;
\echo '-- anon intenta escribir datos de contacto ajenos (debe FALLAR) --'
update public.contact_info set email='robado@mal.com';
\echo '-- anon intenta ver el registro de tarjetas entregadas (debe dar 0) --'
select 'anon lee cards' as caso, count(*) as filas from public.cards;
\echo '-- anon intenta leer y escribir eventos directamente (debe dar 0 / FALLAR) --'
select 'anon lee events' as caso, count(*) as filas from public.events;
insert into public.events (profile_id, tipo) values
  ((select id from public.profiles where slug='estudio-demo'), 'vista');
reset role;

\echo ''
\echo '=== REGISTRO DE EVENTOS (via RPC, que es la unica puerta) ==='
set role anon;
\echo '-- vista de un perfil activo: se registra --'
select public.registrar_evento('estudio-demo', 'vista', null, 'https://www.google.com/search?q=contador+san+luis');
\echo '-- clic sobre un boton propio del perfil: se registra --'
select public.registrar_evento(
  'estudio-demo', 'clic',
  (select l.id from public.links l join public.profiles p on p.id=l.profile_id
   where p.slug='estudio-demo' order by l.orden limit 1),
  null);
\echo '-- perfil pausado: se descarta --'
select public.registrar_evento('perfil-pausado', 'vista', null, null);
\echo '-- tipo invalido: se descarta --'
select public.registrar_evento('estudio-demo', 'robar-datos', null, null);
\echo '-- link de OTRO perfil: se descarta --'
select public.registrar_evento('estudio-demo', 'clic',
  (select id from public.links limit 1 offset 0), null);
reset role;

set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
select 'eventos registrados' as caso, tipo, count(*) as filas
from public.events group by tipo order by tipo;
\echo '-- del referrer se guarda SOLO el dominio, nunca la URL con el termino buscado --'
select 'referrer normalizado' as caso, referrer
from public.events where referrer is not null;
select 'ningun referrer con ruta' as caso,
       count(*) filter (where referrer like '%/%' or referrer like '%?%') as con_ruta
from public.events;
select 'ningun evento del perfil pausado' as caso, count(*) as filas
from public.events e join public.profiles p on p.id=e.profile_id where p.activo = false;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== CLIENTE PREMIUM (se autoedita y ve metricas) ==='
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio='Editado por el titular', paleta='tierra' where slug='estudio-demo';
select 'edito su bio y su color' as caso, bio, paleta from public.profiles where slug='estudio-demo';

\echo '-- intenta subirse solo de plan (debe FALLAR) --'
update public.profiles set plan='premium' where slug='cliente-basico';
\echo '-- intenta cambiar SU propio plan (debe FALLAR: lo frena el trigger) --'
update public.profiles set plan='basico' where slug='estudio-demo';
\echo '-- intenta robarle la fila a otra cuenta (debe FALLAR) --'
update public.profiles set user_id='33333333-3333-3333-3333-333333333333' where slug='estudio-demo';
\echo '-- intenta cambiar su slug, que rompe las tarjetas entregadas (debe FALLAR) --'
update public.profiles set slug='otro-nombre' where slug='estudio-demo';
\echo '-- intenta cambiar el codigo grabado en el chip (debe FALLAR) --'
update public.profiles set codigo_corto='hackead' where slug='estudio-demo';

\echo '-- gestiona sus links y su contacto (debe funcionar) --'
insert into public.links (profile_id, tipo, label, valor, orden)
  select id,'web','Mi web nueva','https://nuevo.com',99 from public.profiles where slug='estudio-demo';
select 'agrego un link' as caso, count(*) as filas from public.links where label='Mi web nueva';
update public.contact_info set telefono='2664999999'
  where profile_id=(select id from public.profiles where slug='estudio-demo');
select 'edito su contacto' as caso, telefono from public.contact_info
  where profile_id=(select id from public.profiles where slug='estudio-demo');

\echo '-- ve SUS metricas (premium) --'
select 'lee sus eventos' as caso, count(*) > 0 as ok from public.events
  where profile_id=(select id from public.profiles where slug='estudio-demo');

\echo '-- intenta tocar OTRO perfil (debe afectar 0) --'
update public.profiles set nombre='Robado' where slug='perfil-pausado';
select 'perfil ajeno intacto' as caso, count(*) as filas from public.profiles where nombre='Robado';
\echo '-- intenta ver el registro interno de tarjetas (debe dar 0) --'
select 'cliente lee cards' as caso, count(*) as filas from public.cards;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== CLIENTE BASICO (no se autoedita ni ve metricas) ==='
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 've su propio perfil' as caso, count(*) as filas from public.profiles where slug='cliente-basico';
\echo '-- intenta editar su propio perfil (debe afectar 0: el panel es del Plus para arriba) --'
update public.profiles set nombre='Me edito solo' where slug='cliente-basico';
select 'no se pudo editar' as caso, nombre from public.profiles where slug='cliente-basico';
\echo '-- intenta agregarse un link (debe FALLAR) --'
insert into public.links (profile_id, tipo, label, valor)
  select id,'web','Link propio','https://x.com' from public.profiles where slug='cliente-basico';
\echo '-- intenta leer los eventos de su propio perfil (debe dar 0: es del Premium) --'
select 'basico lee sus events' as caso, count(*) as filas from public.events
  where profile_id=(select id from public.profiles where slug='cliente-basico');
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== USUARIO LOGUEADO SIN PERMISOS (intruso) ==='
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'intruso ve solo activos' as caso, count(*) as filas from public.profiles;
update public.profiles set nombre='Robado' where slug='estudio-demo';
insert into public.profiles (slug, nombre) values ('intruso-slug','Intruso');
select 'intruso lee admin_users' as caso, count(*) as filas from public.admin_users;
select 'intruso lee events' as caso, count(*) as filas from public.events;
select 'intruso lee cards' as caso, count(*) as filas from public.cards;
\echo '-- intenta vincularse una cuenta a un perfil ajeno (debe FALLAR) --'
select public.vincular_cuenta(
  (select id from public.profiles where slug='estudio-demo'),
  'intruso@ejemplo.com');
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
\echo '-- el admin SI puede cambiar plan y slug --'
update public.profiles set plan='premium' where slug='cliente-basico';
select 'admin cambio el plan' as caso, plan from public.profiles where slug='cliente-basico';
\echo '-- vincula una cuenta por email --'
select public.vincular_cuenta(
  (select id from public.profiles where slug='nuevo-cliente'),
  'intruso@ejemplo.com') as resultado;
\echo '-- email inexistente (debe FALLAR con mensaje claro) --'
select public.vincular_cuenta(
  (select id from public.profiles where slug='nuevo-cliente'),
  'no-existe@ejemplo.com');
\echo '-- registra tarjetas entregadas --'
insert into public.cards (profile_id, entregada_el, reposicion)
  select id, current_date, false from public.profiles where slug='estudio-demo';
select 'admin registro una tarjeta' as caso, count(*) as filas from public.cards;
\echo '-- metricas agregadas --'
select 'metricas: primera fila es el total' as caso, link_id is null as total, etiqueta
from public.metricas_perfil((select id from public.profiles where slug='estudio-demo'), 30)
limit 1;
reset role; reset request.jwt.claim.sub;

\echo ''
\echo '=== CONSTRAINTS ==='
\echo '-- slug duplicado (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('estudio-demo','Duplicado');
\echo '-- slug con mayusculas/espacios (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('Estudio Demo','Mal Slug');
\echo '-- nombre vacio (debe FALLAR) --'
insert into public.profiles (slug, nombre) values ('vacio','   ');
\echo '-- plan inexistente (debe FALLAR) --'
insert into public.profiles (slug, nombre, plan) values ('plan-raro','Raro','enterprise');
\echo '-- paleta inexistente (debe FALLAR) --'
insert into public.profiles (slug, nombre, paleta) values ('color-raro','Raro','fucsia');
\echo '-- layout inexistente (debe FALLAR) --'
insert into public.profiles (slug, nombre, layout) values ('layout-raro','Raro','a-medida');
\echo '-- tipo de evento inexistente (debe FALLAR) --'
insert into public.events (profile_id, tipo)
  values ((select id from public.profiles where slug='estudio-demo'),'compra');

\echo ''
\echo '=== BORRADO EN CASCADA ==='
select 'links antes' as caso, count(*) as filas from public.links;
select 'contacto antes' as caso, count(*) as filas from public.contact_info;
select 'eventos antes' as caso, count(*) as filas from public.events;
select 'cards antes' as caso, count(*) as filas from public.cards;
delete from public.profiles where slug='estudio-demo';
select 'links despues' as caso, count(*) as filas from public.links;
select 'contacto despues' as caso, count(*) as filas from public.contact_info;
select 'eventos despues' as caso, count(*) as filas from public.events;
select 'cards despues' as caso, count(*) as filas from public.cards;

\echo ''
\echo '=== STORAGE ==='
select 'bucket fotos publico' as caso, id, public from storage.buckets;
select 'uuid_o_null no explota con basura' as caso,
       public.uuid_o_null('no-es-un-uuid') as resultado;
