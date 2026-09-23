-- =============================================================================
-- TakeMyCard · endurecer funciones SECURITY DEFINER
--
-- Las funciones siguientes ejecutan con privilegios de su propietario para
-- resolver políticas RLS o exponer operaciones cuidadosamente acotadas. Todas
-- sus referencias ya están calificadas (`public.*` / `auth.*`), así que no
-- necesitan buscar objetos en `public` ni en `pg_temp`.
--
-- Fijar una ruta vacía evita que un objeto con el mismo nombre, creado en un
-- esquema de búsqueda, llegue a resolverse con esos privilegios. Es una capa
-- adicional: los GRANT y los chequeos explícitos de cada función siguen siendo
-- necesarios y no cambian con esta migración.
-- =============================================================================

alter function public.es_admin() set search_path = '';
alter function public.estado_slug(text) set search_path = '';
alter function public.puede_autoeditar(uuid) set search_path = '';
alter function public.proteger_campos_de_negocio() set search_path = '';
alter function public.slug_por_codigo(text) set search_path = '';
alter function public.registrar_evento(text, text, uuid, text) set search_path = '';
alter function public.vincular_cuenta(uuid, text) set search_path = '';
alter function public.cuentas_sin_perfil() set search_path = '';
