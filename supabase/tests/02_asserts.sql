-- =============================================================================
-- Aserciones automáticas de seguridad.
--
-- 01_rls.sql imprime el detalle para leerlo con los ojos; este archivo es el
-- que hace fallar la build. Corre con ON_ERROR_STOP=1, así que cualquier
-- `raise exception` de acá abajo corta el script con código distinto de cero.
--
-- Son las invariantes que, si se rompen, filtran datos o dejan editar lo que no
-- corresponde. Cada una está escrita como "esto NO tiene que poder pasar".
-- =============================================================================

-- Actores propios, para no depender del estado que dejó el archivo anterior.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001','assert-admin@takemycard.ar'),
  ('aaaaaaaa-0000-0000-0000-000000000002','assert-premium@ejemplo.com'),
  ('aaaaaaaa-0000-0000-0000-000000000003','assert-basico@ejemplo.com'),
  ('aaaaaaaa-0000-0000-0000-000000000004','assert-ajeno@ejemplo.com');

insert into public.admin_users (user_id, email)
  values ('aaaaaaaa-0000-0000-0000-000000000001','assert-admin@takemycard.ar');

insert into public.profiles (slug, nombre, plan, user_id, activo) values
  ('assert-premium','Premium','premium','aaaaaaaa-0000-0000-0000-000000000002', true),
  ('assert-basico','Básico','basico','aaaaaaaa-0000-0000-0000-000000000003', true),
  ('assert-pausado','Pausado','plus', null, false);

insert into public.links (profile_id, tipo, label, valor, orden)
  select id,'whatsapp','WhatsApp','2664000000',1
  from public.profiles where slug in ('assert-premium','assert-pausado');

insert into public.links (profile_id, tipo, label, valor, orden, activo)
  select id,'web','Link pausado','https://ejemplo.com',2,false
  from public.profiles where slug = 'assert-premium';

insert into public.contact_info (profile_id, telefono)
  select id,'2664000000' from public.profiles where slug='assert-premium';

insert into public.cards (profile_id, reposicion)
  select id, false from public.profiles where slug='assert-premium';

select public.registrar_evento('assert-premium','vista',null,'https://ejemplo.com/una/ruta?q=secreto');
select public.registrar_evento('assert-premium','clic',null,null,'guardar_contacto');
select public.registrar_evento(
  'assert-premium', 'clic',
  (select id from public.links where label = 'WhatsApp' and profile_id =
    (select id from public.profiles where slug = 'assert-premium')),
  null, 'link'
);
select public.registrar_evento(
  'assert-premium', 'clic',
  (select id from public.links where label = 'Link pausado' and profile_id =
    (select id from public.profiles where slug = 'assert-premium')),
  null, 'link'
);

do $$
declare
  v_premium uuid := (select id from public.profiles where slug='assert-premium');
  v_pausado uuid := (select id from public.profiles where slug='assert-pausado');
  v_basico  uuid := (select id from public.profiles where slug='assert-basico');
  n int;
  t text;
begin
  -- === El bucket público sólo recibe las fotos que genera el editor =========
  if (select file_size_limit from storage.buckets where id = 'fotos') <> 2097152 then
    raise exception 'FALLA: el bucket fotos no tiene el límite de 2 MiB';
  end if;

  if (select allowed_mime_types from storage.buckets where id = 'fotos')
     is distinct from array['image/jpeg']::text[] then
    raise exception 'FALLA: el bucket fotos acepta formatos no previstos';
  end if;

  -- === El visitante anónimo =================================================
  set local role anon;

  select count(*) into n from public.profiles where id = v_pausado;
  if n <> 0 then raise exception 'FALLA: anon ve un perfil pausado'; end if;

  select count(*) into n from public.links where profile_id = v_pausado;
  if n <> 0 then raise exception 'FALLA: anon ve los links de un perfil pausado'; end if;

  select count(*) into n from public.events;
  if n <> 0 then raise exception 'FALLA: anon puede leer la analitica'; end if;

  select count(*) into n from public.cards;
  if n <> 0 then raise exception 'FALLA: anon ve el registro interno de tarjetas'; end if;

  select count(*) into n from public.admin_users;
  if n <> 0 then raise exception 'FALLA: anon ve quienes son administradores'; end if;

  select count(*) into n from storage.objects where bucket_id = 'fotos';
  if n <> 0 then raise exception 'FALLA: anon puede listar las fotos del bucket'; end if;

  reset role;

  -- === El referrer nunca guarda la URL completa =============================
  -- "Guardar contacto" no tiene origen: buscamos explícitamente la vista
  -- que sí lo trae, en vez de depender del orden físico de las filas.
  select referrer into t from public.events
  where profile_id = v_premium and referrer is not null
  limit 1;
  if t is distinct from 'ejemplo.com' then
    raise exception 'FALLA: el referrer guardado es "%", deberia ser solo el dominio', t;
  end if;

  select clics into n
  from public.metricas_perfil(v_premium, 30)
  where categoria = 'guardar_contacto';
  if n is distinct from 1 then
    raise exception 'FALLA: Guardar contacto no aparece como evento propio';
  end if;

  select count(*) into n
  from public.events e
  join public.links l on l.id = e.link_id
  where e.profile_id = v_premium and l.label = 'WhatsApp';
  if n <> 1 then raise exception 'FALLA: un click de link activo no se registra'; end if;

  select count(*) into n
  from public.events e
  join public.links l on l.id = e.link_id
  where e.profile_id = v_premium and l.label = 'Link pausado';
  if n <> 0 then raise exception 'FALLA: se registra un click de link pausado'; end if;

  select count(*) into n from public.events
  where profile_id = v_premium and tipo = 'clic' and accion = 'link';
  if n <> 1 then raise exception 'FALLA: un click sin link activo infla las metricas'; end if;

  -- === Una tarjeta física no pierde su destino por un borrado ===============
  begin
    delete from public.profiles where id = v_premium;
    raise exception 'FALLA: se pudo eliminar un perfil con tarjeta física registrada';
  exception
    when others then
      if sqlerrm like 'FALLA:%' then raise; end if;
  end;

  -- === Un cliente no puede tocar lo que no es suyo ==========================
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002', true);

  update public.profiles set nombre='Robado' where id = v_basico;
  if found then raise exception 'FALLA: un cliente edito el perfil de otro'; end if;

  select count(*) into n from public.cards;
  if n <> 0 then raise exception 'FALLA: un cliente ve el registro interno de tarjetas'; end if;

  select count(*) into n from public.events where profile_id <> v_premium;
  if n <> 0 then raise exception 'FALLA: un cliente ve la analitica de otro perfil'; end if;

  -- El profesional con autoedición puede administrar sólo su propia carpeta.
  insert into storage.objects (bucket_id, name)
    values ('fotos', v_premium::text || '/assert-propia.jpg');

  select count(*) into n from storage.objects
    where bucket_id = 'fotos' and name = v_premium::text || '/assert-propia.jpg';
  if n <> 1 then raise exception 'FALLA: un cliente no ve su propia foto'; end if;

  begin
    insert into storage.objects (bucket_id, name)
      values ('fotos', v_basico::text || '/assert-ajena.jpg');
    raise exception 'FALLA: un cliente pudo escribir en la carpeta de otro';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm like 'FALLA:%' then raise; end if;
  end;

  reset role;
  perform set_config('request.jwt.claim.sub','', true);

  -- === El plan básico no se autoedita ni ve métricas =========================
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000003', true);

  update public.profiles set nombre='Me edito solo' where id = v_basico;
  if found then raise exception 'FALLA: un plan basico pudo autoeditarse'; end if;

  select count(*) into n from public.events where profile_id = v_basico;
  if n <> 0 then raise exception 'FALLA: un plan basico pudo leer sus metricas'; end if;

  begin
    insert into storage.objects (bucket_id, name)
      values ('fotos', v_basico::text || '/assert-basico.jpg');
    raise exception 'FALLA: un plan basico pudo subir una foto';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm like 'FALLA:%' then raise; end if;
  end;

  reset role;
  perform set_config('request.jwt.claim.sub','', true);

  -- === Un logueado cualquiera no ve nada de nadie ===========================
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000004', true);

  select count(*) into n from public.profiles where id = v_pausado;
  if n <> 0 then raise exception 'FALLA: un usuario cualquiera ve perfiles pausados'; end if;

  select count(*) into n from public.events;
  if n <> 0 then raise exception 'FALLA: un usuario cualquiera lee la analitica'; end if;

  select count(*) into n from public.cards;
  if n <> 0 then raise exception 'FALLA: un usuario cualquiera lee el registro de tarjetas'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub','', true);

  -- === Los eventos sólo entran por el RPC ===================================
  set local role anon;
  begin
    insert into public.events (profile_id, tipo) values (v_premium, 'vista');
    raise exception 'FALLA: anon pudo insertar eventos a mano';
  exception
    when insufficient_privilege then null;  -- lo esperado
    when others then
      if sqlerrm like 'FALLA:%' then raise; end if;
  end;
  reset role;

  -- === El RPC descarta lo que no corresponde ================================
  select count(*) into n from public.events where profile_id = v_pausado;
  if n <> 0 then raise exception 'FALLA: se registraron eventos de un perfil pausado'; end if;

  -- === La lista de cuentas pendientes es sólo para administradores ==========
  -- Es una lista de emails de clientes: filtrarla en la interfaz no alcanza.
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000004', true);
  begin
    perform public.cuentas_sin_perfil();
    raise exception 'FALLA: un usuario cualquiera pudo listar las cuentas pendientes';
  exception
    when others then
      if sqlerrm like 'FALLA:%' then raise; end if;  -- lo esperado es el rechazo
  end;
  reset role;
  perform set_config('request.jwt.claim.sub','', true);

  -- El admin sí la ve, y no se lista a sí mismo ni a quien ya tiene perfil.
  set local role authenticated;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001', true);
  select count(*) into n from public.cuentas_sin_perfil()
   where email in ('assert-admin@takemycard.ar','assert-premium@ejemplo.com');
  if n <> 0 then
    raise exception 'FALLA: cuentas_sin_perfil lista cuentas que ya tienen perfil o son admin';
  end if;
  reset role;
  perform set_config('request.jwt.claim.sub','', true);

  raise notice 'TODAS LAS ASERCIONES DE SEGURIDAD PASARON';
end $$;
