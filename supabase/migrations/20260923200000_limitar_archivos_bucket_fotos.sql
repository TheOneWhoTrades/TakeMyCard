-- =============================================================================
-- TakeMyCard · límites del bucket público de fotos
--
-- Las fotos terminan siempre como JPEG luego del recorte en el navegador. El
-- bucket es público porque esas fotos forman parte de la tarjeta digital, pero
-- eso no implica aceptar cualquier archivo ni reservar almacenamiento sin
-- límite para cada cliente que pueda autoeditar su perfil.
-- =============================================================================

update storage.buckets
set
  -- La foto de portada que genera el editor mide 1500 px de ancho y queda muy
  -- por debajo de este techo; 2 MiB deja margen ante fotos complejas sin
  -- permitir que el bucket se use como depósito de archivos grandes.
  file_size_limit = 2097152,
  -- El editor exporta JPEG de forma explícita. Aceptar sólo ese MIME hace que
  -- una llamada directa a Storage no pueda subir documentos, HTML o formatos
  -- que el producto no muestra.
  allowed_mime_types = array['image/jpeg']::text[]
where id = 'fotos';
