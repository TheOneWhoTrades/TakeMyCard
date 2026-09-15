-- =============================================================================
-- TakeMyCard · perfil de prueba
-- Datos ficticios para mostrar la plataforma a los clientes piloto.
-- Se puede correr las veces que haga falta: es idempotente.
-- =============================================================================

insert into public.profiles (slug, nombre, profesion, bio, foto_url, plan, activo)
values (
  'dra-lucia-fernandez',
  'Dra. Lucía Fernández',
  'Odontóloga · Ortodoncia y estética dental',
  'Atención personalizada en San Luis capital. Turnos de lunes a viernes, obras sociales y particulares. Más de 10 años acompañando sonrisas.',
  null,
  'basico',
  true
)
on conflict (slug) do update set
  nombre    = excluded.nombre,
  profesion = excluded.profesion,
  bio       = excluded.bio,
  activo    = excluded.activo;

-- Los links se reemplazan enteros para que el seed sea reproducible.
delete from public.links
where profile_id = (select id from public.profiles where slug = 'dra-lucia-fernandez');

insert into public.links (profile_id, tipo, label, valor, orden)
select p.id, v.tipo::link_tipo, v.label, v.valor, v.orden
from public.profiles p,
(values
  ('whatsapp',  'Escribime por WhatsApp', '2664123456',                                   1),
  ('agenda',    'Pedir turno online',     'https://calendly.com/dra-lucia-fernandez',     2),
  ('instagram', 'Seguime en Instagram',   'dra.luciafernandez',                           3),
  ('ubicacion', 'Cómo llegar al consultorio', 'Av. Illia 350, San Luis, Argentina',       4),
  ('web',       'Sitio web',              'https://ejemplo-odontologia.com.ar',           5),
  ('alias_cbu', 'Alias para señas',       'lucia.odonto.sl',                              6),
  ('email',     'Escribirme un mail',     'contacto@ejemplo-odontologia.com.ar',          7)
) as v(tipo, label, valor, orden)
where p.slug = 'dra-lucia-fernandez';
