-- =============================================================================
-- TakeMyCard · perfil de demostración
--
-- Es el que se muestra en la venta («ver una tarjeta de ejemplo» en la home) y
-- el que usamos para probar la plataforma. Datos ficticios, plan Premium, para
-- que se vea todo lo que el producto puede hacer.
--
-- Se puede correr las veces que haga falta: es idempotente.
-- =============================================================================

insert into public.profiles (slug, nombre, profesion, bio, plan, paleta, layout, activo)
values (
  'estudio-demo',
  'Estudio Álvarez & Asociados',
  'Contadores Públicos · Impuestos y sociedades',
  'Asesoramiento impositivo, laboral y societario para pymes y monotributistas de San Luis. Atendemos con turno, en el estudio o por videollamada.',
  'premium',
  'bosque',
  'editorial',
  true
)
on conflict (slug) do update set
  nombre    = excluded.nombre,
  profesion = excluded.profesion,
  bio       = excluded.bio,
  plan      = excluded.plan,
  paleta    = excluded.paleta,
  layout    = excluded.layout,
  activo    = excluded.activo;

-- Los links se reemplazan enteros para que el seed sea reproducible.
delete from public.links
where profile_id = (select id from public.profiles where slug = 'estudio-demo');

insert into public.links (profile_id, tipo, label, valor, orden)
select p.id, v.tipo::link_tipo, v.label, v.valor, v.orden
from public.profiles p,
(values
  ('whatsapp',  'Escribinos por WhatsApp',   '2664123456',                             1),
  ('agenda',    'Pedir turno',               'https://calendly.com/estudio-demo',      2),
  ('telefono',  'Llamar al estudio',         '2664123456',                             3),
  ('ubicacion', 'Cómo llegar',               'Av. Illia 350, San Luis, Argentina',     4),
  ('linkedin',  'Seguinos en LinkedIn',      'company/estudio-demo',                   5),
  ('web',       'Nuestro sitio',             'https://ejemplo-estudio.com.ar',         6),
  ('alias_cbu', 'Alias para transferencias', 'estudio.demo.sl',                        7)
) as v(tipo, label, valor, orden)
where p.slug = 'estudio-demo';

-- Datos de contacto: es lo que se guarda en la agenda al tocar «Guardar contacto».
insert into public.contact_info (profile_id, telefono, email, direccion, redes)
select
  p.id,
  '2664123456',
  'contacto@ejemplo-estudio.com.ar',
  'Av. Illia 350, San Luis, Argentina',
  '{"linkedin": "company/estudio-demo"}'::jsonb
from public.profiles p
where p.slug = 'estudio-demo'
on conflict (profile_id) do update set
  telefono  = excluded.telefono,
  email     = excluded.email,
  direccion = excluded.direccion,
  redes     = excluded.redes;
