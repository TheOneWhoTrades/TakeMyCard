# Base de datos (Supabase)

Todo el contenido de las tarjetas vive acá. El chip NFC nunca se reprograma:
guarda `tudominio.com/t/<codigo_corto>` y lo que cambia es la fila.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com). Región
   recomendada: `South America (São Paulo)` — es la más cercana a San Luis y
   recorta unos 100 ms por consulta frente a las de EE.UU.

2. **Aplicar el esquema.** En el Dashboard → *SQL Editor* → *New query*, pegar
   y ejecutar **en orden** los archivos de
   [`supabase/migrations/`](../supabase/migrations/). Son idempotentes: se
   pueden volver a correr sin romper nada.

   Con la CLI de Supabase, alternativamente:

   ```bash
   supabase link --project-ref <ref-del-proyecto>
   supabase db push
   ```

3. **Cargar el perfil de demostración** (recomendado: es el que se muestra en la
   venta): ejecutar [`supabase/seed.sql`](../supabase/seed.sql) en el SQL
   Editor. Crea `/estudio-demo`, plan Premium, con datos ficticios.

4. **Crear el usuario administrador.** En *Authentication → Users → Add user*,
   con email y contraseña, marcando **Auto Confirm User** (si no, queda
   pendiente de verificación y no puede entrar). Después, en el SQL Editor:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'tu-email@ejemplo.com';
   ```

   Sin este `insert` el login funciona pero el panel rebota con
   "tu cuenta no tiene permisos": tener cuenta y ser admin son cosas distintas.

5. **Habilitar el enlace de un solo uso** para los clientes (Plus y Premium).
   En *Authentication → Providers → Email*, dejar habilitado *Email* y
   **desactivar** *Enable sign-ups* si no querés que cualquiera se cree una
   cuenta: la app ya pide `shouldCreateUser: false`, así que el enlace sólo
   funciona para cuentas que existan. En *Authentication → URL Configuration*,
   agregar a *Redirect URLs*:

   ```
   https://<tu-dominio>/auth/callback
   https://*.vercel.app/auth/callback     (para las previews)
   http://localhost:3000/auth/callback
   ```

   Sin esto, el enlace del mail rebota. El SMTP incluido de Supabase alcanza
   para el volumen del piloto; para producción conviene configurar uno propio.

6. **Copiar las claves.** En *Project Settings → API* (según la versión del
   panel, puede ser una sección aparte llamada *API Keys*) están los dos valores:

   | Variable | De dónde sale | Pinta |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Publishable key*, o `anon` `public` en el panel viejo | `sb_publishable_…` o `eyJhbGciOi…` |

   Van en un archivo **`.env.local`** en la raíz del proyecto (`cp .env.example
   .env.local` y editás la copia), o en las variables de entorno de Vercel.
   **No en `.env.example`**, que es la plantilla versionada en el repo.

   Dos errores que cuestan una tarde:

   - **La URL va pelada, sin `/rest/v1`.** El cliente de Supabase agrega esa
     ruta solo. Si la ponés, las consultas salen a `/rest/v1/rest/v1/...` y
     Supabase devuelve vacío *sin error*: la app arranca bien pero ningún perfil
     existe. `lib/env.ts` valida esto y corta el arranque con un mensaje claro.
   - **Nunca uses la `service_role` ni una `sb_secret_…`.** Esas claves se
     saltean RLS, y todo lo que empieza con `NEXT_PUBLIC_` se manda al navegador
     de cada visitante. Este proyecto no necesita ninguna de las dos.

## Dar de alta un cliente

1. En `/admin` → *Nuevo perfil*: nombre, slug y plan.
2. Cargar fotos, botones y datos de contacto (o dejar que lo haga el cliente si
   es Plus o Premium).
3. **Si es Plus o Premium**, para que pueda entrar a `/panel`:
   - crear su cuenta en *Authentication → Users → Add user* (o *Invite*);
   - en `/admin/<id>` → *Acceso del cliente*, pegar ese email y tocar *Vincular*.
4. Grabar en el chip la URL que muestra la pantalla de edición, arriba de todo:
   `https://<dominio>/t/<codigo_corto>`. **No** grabar `/slug` directo.
5. Registrar las tarjetas entregadas en *Tarjetas físicas*, para llevar la
   cuenta de las dos incluidas y de las reposiciones.

## Tablas

### `profiles` — un registro por profesional / por tarjeta

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` único, indexado | La URL pública. `^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$` |
| `codigo_corto` | `text` único | Lo que se graba en el chip. **Inmutable** |
| `nombre` | `text` | Obligatorio, no vacío |
| `profesion` | `text` | El «cargo» del brief. Opcional |
| `bio` | `text` | Opcional, máx. 500 caracteres |
| `foto_url` | `text` | URL pública del bucket `fotos` |
| `portada_url` | `text` | Ídem. Sólo se muestra en Plus y Premium |
| `paleta` | `text` | Una de las seis de `lib/paletas.ts` |
| `layout` | `text` | `estandar` \| `editorial` \| `retrato` \| `vidriera`. Las tres últimas, sólo Premium |
| `plan` | `text` | `basico` \| `plus` \| `premium`. Default `basico` |
| `user_id` | `uuid` → `auth.users` | Nullable. Cuenta del profesional, si tiene |
| `activo` | `bool` | El «estado» del brief. En `false` la página muestra un aviso |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` lo mantiene un trigger |

> **Slug vs. código corto.** El slug puede cambiar: el cliente se muda de rubro,
> se casa, cambia de nombre comercial. El código corto **no cambia nunca**,
> porque es lo único que la tarjeta física conoce. Si un cliente se da de baja,
> conviene **pausar** (`activo = false`) y no eliminar: quien tenga la tarjeta ve
> un mensaje claro en vez de un 404, y los datos se pueden reactivar.

### `links` — botones de contacto

| Columna | Tipo | Notas |
|---|---|---|
| `profile_id` | `uuid` → `profiles` | `ON DELETE CASCADE` |
| `tipo` | `link_tipo` | Determina cómo se arma el `href` |
| `label` | `text` | La «etiqueta» del brief: el texto del botón |
| `valor` | `text` | **Valor crudo**, no una URL armada |
| `orden` | `int` | Ascendente. Los paneles reordenan con ↑ / ↓ |
| `activo` | `bool` | El «visible» del brief |

| `tipo` | Qué se carga en `valor` | Qué hace el botón |
|---|---|---|
| `whatsapp` | `2664123456` | `https://wa.me/5492664123456` |
| `telefono` | `2664123456` | `tel:+5492664123456` |
| `email` | `hola@ejemplo.com` | `mailto:` |
| `instagram` / `facebook` / `tiktok` / `youtube` | usuario sin `@`, o la URL completa | Perfil de la red |
| `linkedin` | `in/usuario`, o la URL completa | Perfil |
| `web` / `agenda` / `otro` | URL completa | Abre el sitio |
| `ubicacion` | dirección, o URL de Maps | Búsqueda en Google Maps |
| `alias_cbu` | `mi.alias.mp` | **No es un enlace**: botón de copiar |

### `contact_info` — los datos que van a la agenda

Una fila por perfil: `telefono`, `email`, `direccion`, `redes` (jsonb).

Están separados de `links` porque no son lo mismo: un link es un botón que el
visitante toca; esto es lo que queda en su teléfono al tocar «Guardar
contacto». Se suelen repetir, pero no siempre. La vCard les da prioridad y
completa con los links lo que falte, sin duplicar.

### `events` — analítica sin visitante

| Columna | Notas |
|---|---|
| `profile_id` | `ON DELETE CASCADE` |
| `tipo` | `vista` \| `clic` |
| `link_id` | Sólo en los clics. `ON DELETE SET NULL` |
| `referrer` | **Sólo el dominio**, nunca la URL. `NULL` si fue directo |
| `created_at` | |

**Lo que no se guarda, y está escrito en la migración para que no se agregue por
descuido:** IP, user-agent, cookie, identificador de dispositivo, ni nada que
permita reconocer a un visitante entre dos visitas.

Los eventos se registran para todos los planes; sólo el Premium puede leerlos.
Así, un cliente que sube de plan tiene historial desde el día uno.

**`events` no tiene política de `INSERT` para nadie.** La única puerta de
escritura es `registrar_evento()`, que valida que el perfil esté activo, que el
link pertenezca a ese perfil, y que del referrer quede sólo el host. Sin eso,
cualquiera con la `anon key` —que es pública por diseño— podría inventar filas.

### `cards` — tarjetas físicas entregadas

`entregada_el`, `reposicion` (sí/no), `nota`. Registro interno: no sale a la
página pública ni lo ve el cliente en su panel. Sirve para saber si ya usó las
dos incluidas en el plan y para tener fecha ante un reclamo.

### `admin_users` — quiénes somos nosotros

Se usa una tabla en vez de un *custom claim* en el JWT: dar de alta un admin es
un `INSERT` y no obliga a re-emitir tokens.

## Row Level Security

RLS está activo en todas las tablas y en `storage.objects`. **Ninguna parte de
la app usa la `service_role` key** — ni siquiera el backoffice, que opera con la
sesión del usuario. Así, un bug en un panel no puede convertirse en una fuga de
datos de todos los clientes: la base sigue decidiendo.

| Tabla | Público (`anon`) | Cliente (`plus`/`premium`) | Admin |
|---|---|---|---|
| `profiles` | lee sólo `activo = true` | lee el suyo (aunque esté pausado) y lo edita | todo |
| `links` | lee los de perfiles activos | gestiona los suyos | todo |
| `contact_info` | lee los de perfiles activos | gestiona el suyo | todo |
| `events` | **sin acceso** (ni lectura ni escritura) | lee los suyos **sólo si es premium** | lectura |
| `cards` | sin acceso | sin acceso | todo |
| `admin_users` | sin acceso | sin acceso | lee su propia fila |
| `storage.objects` (`fotos`) | sin acceso por la API | escribe en `fotos/<su profile_id>/` | todo |

Detalles que no son obvios:

- **`es_admin()` y `puede_autoeditar()` son `SECURITY DEFINER`.** Si no lo
  fueran, consultar `admin_users` desde una política de `admin_users` entraría
  en recursión infinita, y las políticas de `links` volverían a pasar por las de
  `profiles`.
- **Las políticas de autoedición repiten las condiciones en `WITH CHECK`.** Sin
  eso, el cliente podría cambiarse el `plan` o reasignar `user_id`.
- **Además hay un trigger, `proteger_campos_de_negocio`.** Impide que un
  usuario que no sea admin cambie `plan`, `user_id`, `slug` o `codigo_corto`, y
  da un mensaje explicando por qué. Es cinturón y tiradores: RLS ya lo impide,
  pero el trigger protege también cualquier camino futuro que no pase por las
  políticas. No se aplica cuando `auth.uid()` es null —una migración, el editor
  SQL, la clave de servicio—, porque esos caminos ya se saltean RLS por
  definición y si no podríamos corregir un plan a mano.
- **`estado_slug()` es `SECURITY DEFINER` a propósito.** RLS devuelve cero filas
  tanto para un slug inexistente como para uno pausado, así que la página no
  podría distinguirlos. Devuelve sólo el estado, nunca el contenido de la fila.
- **`slug_por_codigo()` también.** Tiene que encontrar los perfiles pausados,
  para que la tarjeta lleve al aviso de «pausada» en vez de a un 404 seco.
- **El bucket `fotos` es público pero `anon` no puede *listarlo*.** Las imágenes
  se sirven por `/storage/v1/object/public/...`, que no pasa por RLS; la
  política de lectura para `anon` sólo habilitaba enumerar el bucket por la API
  y ver las fotos de todos los perfiles, incluidos los pausados. Se quitó.

## Probar los cambios

```bash
npm run test:db
```

Levanta un Postgres efímero, aplica las migraciones en orden y verifica las
políticas. Son dos archivos con propósitos distintos:

- **`01_rls.sql`** recorre cada caso e imprime el resultado, para leerlo. Los
  `ERROR` que aparecen son **esperados**: son los intentos de escritura que las
  políticas deben rechazar, y cada bloque dice qué espera antes de ejecutarse.
- **`02_asserts.sql`** afirma las invariantes y **corta el script** si alguna se
  rompe. Es el que hace fallar la CI: que `anon` no lea la analítica ni el
  registro de tarjetas, que un cliente no toque el perfil de otro, que el Básico
  no se autoedite ni vea métricas, que el referrer guardado no tenga la ruta.

Requiere `postgresql-16` local. No toca el proyecto Supabase real.

## Storage

La migración crea el bucket público `fotos`. Las imágenes se guardan en
`fotos/<profile_id>/<archivo>.jpg`, y esa ruta es lo que ata el archivo al
perfil en la política: un cliente escribe en su carpeta y en ninguna otra.

Suben desde el panel, ya recortadas en el navegador. Se guarda la URL completa y
no la ruta del objeto para que `foto_url` acepte también imágenes alojadas en
otro lado, aunque el panel del cliente sólo acepta las del bucket propio —una
imagen remota en el perfil sería una forma de registrar quién abre la tarjeta
desde afuera de nuestro control.
