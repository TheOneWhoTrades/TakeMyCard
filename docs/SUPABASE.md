# Base de datos (Supabase)

Todo el contenido de las tarjetas vive acá. El chip NFC nunca se reprograma:
guarda una URL fija (`tudominio.com/<slug>`) y lo que cambia es la fila.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com). Región
   recomendada: `South America (São Paulo)` — es la más cercana a San Luis y
   recorta unos 100 ms por consulta frente a las de EE.UU.

2. **Aplicar el esquema.** En el Dashboard → *SQL Editor* → *New query*, pegar
   el contenido de [`supabase/migrations/20260915120000_init.sql`](../supabase/migrations/20260915120000_init.sql)
   y ejecutarlo. Es idempotente: se puede volver a correr sin romper nada.

   Con la CLI de Supabase, alternativamente:

   ```bash
   supabase link --project-ref <ref-del-proyecto>
   supabase db push
   ```

3. **Cargar el perfil de prueba** (opcional pero recomendado para tener algo
   que mostrar): ejecutar [`supabase/seed.sql`](../supabase/seed.sql) en el SQL
   Editor. Crea `/dra-lucia-fernandez` con datos ficticios.

4. **Crear el usuario administrador.** En *Authentication → Users → Add user*,
   con email y contraseña, marcando **Auto Confirm User** (si no, queda
   pendiente de verificación y no puede entrar). Después, en el SQL Editor:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'tu-email@ejemplo.com';
   ```

   Sin este `insert` el login funciona pero el panel rebota con
   "tu cuenta no tiene permisos": tener cuenta y ser admin son cosas distintas.

5. **Copiar las claves** desde *Project Settings → API* al `.env.local` del
   proyecto (o a las variables de entorno de Vercel):
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Tablas

### `profiles` — un registro por profesional / por tarjeta

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text` único, indexado | La URL pública. `^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$` |
| `nombre` | `text` | Obligatorio, no vacío |
| `profesion` | `text` | Opcional |
| `bio` | `text` | Opcional, máx. 500 caracteres |
| `foto_url` | `text` | URL pública del bucket `fotos` |
| `plan` | `plan_tipo` | `basico` \| `premium`. Default `basico` |
| `auto_edicion_habilitada` | `bool` | Default `false`. Ver *Auto-edición* abajo |
| `user_id` | `uuid` → `auth.users` | Nullable. Cuenta del profesional, si tiene |
| `activo` | `bool` | Default `true`. En `false` la página muestra un aviso |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` lo mantiene un trigger |

> **Sobre el `slug`:** es lo único que la tarjeta física conoce. Cambiarlo
> **invalida todas las tarjetas ya entregadas** de ese profesional. Si un
> cliente se da de baja, conviene **pausar** (`activo = false`) y no eliminar:
> así el slug queda reservado y quien tenga la tarjeta ve un mensaje claro en
> vez de un 404.

### `links` — botones de contacto

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `profile_id` | `uuid` → `profiles` | `ON DELETE CASCADE` |
| `tipo` | `link_tipo` | Ver lista abajo |
| `label` | `text` | El texto del botón |
| `valor` | `text` | **Valor crudo**, no una URL armada. Ver abajo |
| `orden` | `int` | Ascendente. El panel reordena con ↑ / ↓ |
| `activo` | `bool` | Permite ocultar un botón sin borrarlo |

**`valor` guarda el dato crudo, no el enlace final.** El `href` se arma en
[`lib/links.ts`](../lib/links.ts) según el `tipo`:

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

La razón de guardar el valor crudo es que un alias/CBU no es navegable y un
número de WhatsApp tampoco: si se guardara el `href` ya armado, cargar un
cliente nuevo obligaría a componer URLs a mano y el alias no tendría dónde ir.

### `admin_users` — quiénes somos nosotros

Se usa una tabla en vez de un *custom claim* en el JWT: dar de alta un admin es
un `INSERT` y no obliga a re-emitir tokens. La función `es_admin()` la consulta
desde las políticas.

### `page_views` — analítica mínima

Una fila por visita, sin datos personales. Se inserta desde el servidor
*después* de mandar la respuesta, así no demora la carga de la página. El panel
muestra el total por perfil. No era prioridad; quedó porque salía casi gratis.

## Row Level Security

RLS está activo en las cuatro tablas y en `storage.objects`. **Ninguna parte de
la app usa la `service_role` key** — ni siquiera el panel de admin, que opera
con la sesión del usuario. Así, un bug en el panel no puede convertirse en una
fuga de datos de todos los clientes: la base sigue decidiendo.

| Tabla | Público (`anon`) | Profesional | Admin |
|---|---|---|---|
| `profiles` | lee sólo `activo = true` | edita su fila si `user_id = auth.uid()` **y** `auto_edicion_habilitada` | lectura y escritura totales |
| `links` | lee los de perfiles activos | gestiona los de su perfil, con la misma condición | lectura y escritura totales |
| `admin_users` | sin acceso | sin acceso | lee su propia fila |
| `page_views` | sólo `INSERT`, y sólo para perfiles activos | — | lectura |
| `storage.objects` (`fotos`) | lectura | — | escritura |

Detalles que no son obvios:

- **`es_admin()` es `SECURITY DEFINER`.** Si no lo fuera, consultar
  `admin_users` desde una política de `admin_users` entraría en recursión
  infinita.
- **Las políticas de auto-edición repiten las condiciones en `WITH CHECK`.** Sin
  eso, el profesional podría ponerse `auto_edicion_habilitada = true` él mismo, o
  reasignar `user_id` a otra persona. El test lo verifica.
- **`estado_slug()` es `SECURITY DEFINER` a propósito.** RLS devuelve cero filas
  tanto para un slug inexistente como para uno pausado, así que la página no
  podría distinguirlos. Esta función devuelve sólo el estado
  (`activo` / `inactivo` / `no_existe`), nunca el contenido de la fila, y con eso
  alcanza para dar el mensaje de error correcto.

## Auto-edición (todavía no construida)

El panel donde el profesional edita su propia página **no existe** en esta
versión: el plan básico lo administramos nosotros. Lo que ya está listo es todo
lo que costaría rehacer después:

- la columna `auto_edicion_habilitada`;
- la columna `user_id` que ata el perfil a una cuenta de Supabase Auth;
- las políticas de RLS que dejan a ese usuario editar su perfil y sus links.

El día que se construya, el trabajo es: crear el usuario, hacer
`update profiles set user_id = '<uuid>', auto_edicion_habilitada = true`, y
escribir las pantallas. El modelo de datos y la seguridad no se tocan.

## Storage

La migración crea el bucket público `fotos`. Para cargar una foto: Dashboard →
*Storage* → `fotos` → *Upload*, después copiar la URL pública y pegarla en el
campo correspondiente del panel.

Se guarda la URL en vez de la ruta del objeto para que `foto_url` acepte también
imágenes alojadas en otro lado (por ejemplo, la que el cliente ya tiene en su
web) sin cambiar el esquema.

## Probar los cambios

```bash
npm run test:db
```

Levanta un Postgres efímero, aplica la migración y verifica que las políticas
hagan lo que dicen: que `anon` no pueda escribir, que un profesional no pueda
tocar el perfil de otro ni auto-otorgarse permisos, que el admin vea los
perfiles pausados, y que los `CHECK` rechacen slugs y nombres inválidos.

Los `ERROR` que imprime son **esperados**: son los intentos de escritura que las
políticas deben rechazar. Cada bloque dice qué se espera antes de ejecutarse.

Requiere `postgresql-16` local. No toca el proyecto Supabase real.
