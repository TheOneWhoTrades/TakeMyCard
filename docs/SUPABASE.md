# Base de datos (Supabase)

Todo el contenido de las tarjetas vive acá. El chip NFC nunca se reprograma:
guarda `tudominio.com/t/<codigo_corto>` y lo que cambia es la fila.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com). Región
   recomendada: `South America (São Paulo)` — es la más cercana a San Luis y
   recorta unos 100 ms por consulta frente a las de EE.UU.

2. **Aplicar el esquema.** En el Dashboard → *SQL Editor* → *New query*, pegar
   **el contenido** de cada archivo de
   [`supabase/migrations/`](../supabase/migrations/) y ejecutarlos **en orden**.
   (El nombre del archivo no: el editor ejecuta SQL, no abre archivos. Pegar
   `20260915120000_init.sql` devuelve `trailing junk after numeric literal`.)

   Cada migración es idempotente **por separado**: volver a correr la misma no
   rompe nada. Lo que no se puede es volver a correr la tanda entera sobre una
   base que ya tenga aplicada la segunda migración o una posterior — la primera
   crea una política sobre `auto_edicion_habilitada` y la segunda elimina esa
   columna, así que la primera falla con `column auto_edicion_habilitada does
   not exist`. Ante la duda, esta consulta dice en qué estado está la base:

   ```sql
   select to_regclass('public.profiles')            as tiene_profiles,
          to_regclass('public.events')              as tiene_events,
          to_regclass('public.cards')               as tiene_cards,
          to_regproc('public.cuentas_sin_perfil')   as tiene_cuentas_pendientes;
   ```

   Todo en `NULL` = base limpia, se corren todas desde la primera.

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

5. **Configurar el ingreso de los clientes** (Plus y Premium). En
   *Authentication → Sign In / Providers*, dejar habilitado *Email* y **dejar
   activado** *Allow new users to sign up* (en el panel viejo, *Enable
   sign-ups*): lo necesita la página `/crear-cuenta`. Ese interruptor está en la
   página principal de la sección, arriba de la lista de proveedores, no dentro
   del panel de *Email*.

   Que el registro esté abierto no abre nada: una cuenta recién creada no tiene
   perfil vinculado, y todas las políticas de RLS parten de
   `profiles.user_id = auth.uid()`, así que no puede leer ni escribir una sola
   fila. El alta real la hacés vos desde el backoffice. Conviene además dejar
   activado *Confirm email*, para que no se creen cuentas con emails ajenos: está
   dentro del panel de *Email*, justo debajo de *Enable Email provider* — arriba
   de los campos de contraseña, no al final.

   El ingreso por enlace de un solo uso sí pide `shouldCreateUser: false`: ese
   camino nunca crea cuentas, sólo abre sesión en las que ya existen.

   En *Authentication → URL Configuration* hay dos campos, y hacen falta los
   dos. Primero **Site URL**, que arranca en `http://localhost:3000` y hay que
   cambiar por el dominio real:

   ```
   https://<tu-dominio>
   ```

   Y después, en *Redirect URLs*:

   ```
   https://<tu-dominio>/**
   https://*.vercel.app/**                (para las previews)
   http://localhost:3000/**               (para desarrollo)
   ```

   Sin esto, el enlace del mail rebota, y rebota de la peor manera: cuando el
   destino que pide la app no está en la lista, Supabase **no avisa** — usa el
   *Site URL* en su lugar. Con el valor de fábrica, el cliente que confirma su
   cuenta desde el teléfono termina en `localhost:3000`, que en su teléfono no
   existe, y lee `otp_expired` aunque el enlace estuviera perfecto.

   El comodín `/**` cubre `/auth/callback` y cualquier ruta futura; si preferís
   ser estricto, alcanza con `/auth/callback` en cada línea.

   Dos cosas más de la misma pantalla que conviene saber de antemano: el enlace
   de confirmación vence a la hora (*Email OTP expiration*, en
   *Providers → Email*), y el SMTP incluido de Supabase está limitado a unos
   pocos mails por hora y sólo sirve para probar. Para el piloto hay que
   configurar uno propio en *Authentication → Emails → SMTP*.

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

7. **Configurar el envío de emails (SMTP propio).** El servidor que trae
   Supabase existe para probar, no para operar: está limitado a unos pocos
   mensajes por hora, comparte reputación con todos los proyectos gratuitos de
   Supabase y **Supabase no garantiza la entrega**. Con dos clientes dándose de
   alta la misma tarde ya se corta, y el cliente al que no le llegó el mail de
   confirmación no tiene forma de darse cuenta de por qué.

   El servicio elegido es **Resend**. Los valores van en
   *Authentication → Emails* --en la sección **NOTIFICATIONS** de la barra
   lateral, no en la de CONFIGURATION-- pestaña *SMTP*, y activar
   *Enable Custom SMTP*. (En paneles anteriores esto estaba en
   *Project Settings → Auth → SMTP Settings*; si la guía y el panel no
   coinciden, el panel manda.)

   | Campo | Valor |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` (literal, no es tu email) |
   | Password | la API key de Resend (`re_…`) |
   | Sender email | `no-responder@<tu-dominio>` |
   | Sender name | `TakeMyCard` |

   Los pasos del lado de Resend: crear la cuenta, *Domains → Add Domain*,
   cargar en el DNS del dominio los registros que Resend indique (un TXT de
   verificación, los de DKIM y el de SPF), esperar a que el panel marque el
   dominio como *Verified*, y recién entonces *API Keys → Create API Key* con
   permiso de envío. Esa key es la contraseña del SMTP: se pega en Supabase y
   no se guarda en el repositorio.

   **Esto necesita un dominio propio y todavía no hay uno comprado.** Resend
   --como cualquier servicio serio de envío-- sólo deja mandar desde un dominio
   cuyo DNS controlás: es la única forma de demostrarle a Gmail que el mail sale
   de quien dice salir. Un subdominio de `vercel.app` no sirve, porque el DNS no
   es nuestro. Con la cuenta recién creada y sin dominio verificado, Resend sólo
   entrega al email del titular de la cuenta, así que sirve para una prueba y no
   para el piloto.

   O sea que el orden real es: **comprar el dominio primero**. `lib/marca.ts` ya
   nombra `takemycard.com.ar` como el dominio previsto, y comprarlo resuelve dos
   cosas de una: el remitente de los mails y la dirección del sitio, que hoy es
   una URL de Vercel.

   **Puente vigente durante el piloto: Brevo.** Hasta que exista el dominio se
   usa un proveedor que permite verificar **una sola dirección** de remitente en
   lugar de un dominio entero. Brevo lo hace en su plan gratuito (300 mensajes
   por día) con `proyectotarjetanfc@gmail.com` como remitente verificado.

   Del lado de Brevo: crear la cuenta, *Settings → Senders & IPs → Senders →
   Add a sender* con esa dirección, y confirmar el código de 6 dígitos que llega
   a esa casilla --sin ese paso el remitente no se puede usar--. Después,
   *Settings → SMTP & API → SMTP*, donde están el login y la **SMTP key**. Ojo
   con esto: la SMTP key **no** es la API key, son dos cosas distintas en la
   misma pantalla.

   | Campo | Valor |
   |---|---|
   | Host | `smtp-relay.brevo.com` |
   | Port | `587` |
   | Username | el login que muestra *SMTP & API* (el email de la cuenta, o uno con forma `<id>@smtp-brevo.com` según cuándo se creó) |
   | Password | la **SMTP key**, no la API key |
   | Sender email | `proyectotarjetanfc@gmail.com`, ya verificado |
   | Sender name | `TakeMyCard` |

   **Lo que este puente no resuelve.** Desde febrero de 2024 Gmail endureció la
   autenticación: un mensaje cuyo remitente dice `@gmail.com` pero sale por un
   servidor que no es de Google no puede firmarse con DKIM de gmail.com ni
   figura en el SPF de Gmail. Es decir que estos mails no autentican, y quedan
   sujetos a lo que cada proveedor decida hacer con un mensaje no autenticado.

   En la prueba de puesta en marcha (30/09/2026, destinatario ajeno al
   proyecto) el mail llegó a la bandeja principal. Eso confirma que el puente
   funciona, pero no garantiza el caso general: la decisión de spam depende del
   destinatario, de su historial y de cada proveedor, y puede cambiar sin que
   nosotros toquemos nada. Por eso el aviso "revisá el correo no deseado" de
   `/crear-cuenta` y de `/ingresar` se queda mientras dure el puente, y por eso
   conviene mirar los logs de Brevo ante el primer reclamo en vez de suponer.

   Decisión tomada con esto a la vista: durante el piloto alcanza, porque son
   pocos clientes y el alta se acompaña por WhatsApp. No alcanza para vender sin
   acompañamiento, y ahí es donde entra el dominio con Resend.

   El límite de envío se corrige solo al activar el SMTP propio: en
   *Authentication → Rate Limits*, *Emails per hour* pasa de 2 --el número del
   servidor compartido de prueba-- a 30. No hay que tocarlo a mano. Para el
   piloto sobra; si alguna vez hiciera falta más, ese mismo campo se sube y el
   techo real pasa a ser el de Brevo (300 por día en el plan gratuito).

   **Cómo verificar que un mail salió.** Brevo registra cada envío en
   *Transactional → Logs*, con el estado real: entregado, rebotado o marcado
   como spam. Es el único lugar donde se distingue "no llegó" de "llegó y está
   en la carpeta de no deseados", que desde la aplicación son indistinguibles.

## Dar de alta un cliente

1. En `/admin` → *Nuevo perfil*: nombre, slug y plan.
2. Cargar fotos, botones, color y datos de contacto (o dejar que lo haga el
   cliente si es Plus o Premium).
3. **Si es Plus o Premium**, para que pueda entrar a `/panel`, hay dos caminos
   y el resultado es el mismo: el perfil tiene que quedar con `user_id`.

   - **El cliente se crea la cuenta** en `/crear-cuenta` y te avisa. Aparece
     sola en `/admin` → *Cuentas esperando alta*: elegís su perfil en el select
     y tocás *Vincular*. Es el camino normal, y evita tipear emails a mano.
   - **La creás vos** en *Authentication → Users → Add user* (con *Auto Confirm
     User*) y después, en `/admin/<id>` → *Acceso del cliente*, pegás el email y
     tocás *Vincular*. Sirve cuando el cliente no quiere hacer el trámite.

4. Grabar en el chip la URL que muestra la pantalla de edición, arriba de todo:
   `https://<dominio>/t/<codigo_corto>`. **No** grabar `/slug` directo.
5. Registrar las tarjetas entregadas en *Tarjetas físicas*, para llevar la
   cuenta de las dos incluidas y de las reposiciones.

> Una cuenta sin vincular es inofensiva: quien entra con ella sólo ve el aviso
> de «tu cuenta todavía no está vinculada a ninguna tarjeta». No hay apuro.

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
  `profiles`. Sus referencias a tablas están calificadas con esquema y su
  `search_path` es vacío: una función privilegiada no debe resolver nombres
  desde un esquema que pudiera contener objetos de otra persona.
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
- **`cuentas_sin_perfil()` es `SECURITY DEFINER` y chequea admin primero.** Lee
  `auth.users`, que con la clave pública es inalcanzable; el chequeo va explícito
  y antes de la consulta porque, sin él, la función sería una lista de emails de
  clientes abierta a cualquiera que supiera invocarla. El test lo verifica.
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

Suben desde el panel, ya recortadas en el navegador. Se guarda la URL pública
completa, pero sólo se aceptan URLs del bucket propio y de la carpeta del
perfil. Así una imagen remota no puede registrar quién abre la tarjeta desde
afuera de nuestro control. Al reemplazar o borrar un perfil, la aplicación
retira sus objetos propios del bucket para no dejar fotos públicas huérfanas.
