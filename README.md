# TakeMyCard

Plataforma link-in-bio multi-tenant para tarjetas personales con NFC, para
profesionales de San Luis, Argentina.

Cada profesional tiene una página pública en `tudominio.com/<slug>`. La tarjeta
física **no** guarda esa dirección: guarda un **código corto** (`/t/<codigo>`)
que redirige a ella. El chip nunca se reprograma, así que esa indirección es lo
que permite cambiar de dominio o de slug sin convertir en papel las tarjetas ya
entregadas.

## Los tres planes

Un solo código y una sola base para los tres. El campo `plan` del perfil es el
switch de diseño y de funciones.

| | Básico | Plus | Premium |
|---|---|---|---|
| Precio | USD 50 / año | USD 45 único + USD 8 / mes | USD 50 único + USD 10 / mes |
| Tarjetas físicas incluidas | 2 | 2 | 2 |
| Perfil con contacto y links | Sí | Sí | Sí |
| Botón «Guardar contacto» (vCard) | Sí | Sí | Sí |
| Color de la tarjeta digital | 6 paletas | Sí | Sí |
| Foto de perfil | Sí | Sí | Sí |
| Foto de portada | No | Sí | Sí |
| Panel de autoedición | No | Sí | Sí |
| Seguimiento de datos | No | No | Sí |
| Landing personalizada | No | No | Sí |

En el Básico el perfil lo cargamos y lo editamos nosotros; el cliente no entra
al panel. Ese es el corte principal entre Básico y Plus.

Los eventos se registran para **todos** los planes, pero sólo el Premium ve el
panel de estadísticas: si alguien sube de plan, tiene historial desde el día uno.

## Qué hace

**Sitio comercial** (`/`) — qué es el producto, cómo funciona, los tres planes
con precios, la tabla comparativa completa, preguntas frecuentes y formulario de
contacto. Todo termina en un WhatsApp con el mensaje ya escrito. Es estático: no
consulta la base y no guarda ningún dato del interesado.

**Página pública** (`/<slug>`) — portada, foto, nombre, cargo y presentación;
botones de contacto ordenables; botón «Guardar contacto» que descarga un `.vcf`.
Mobile-first, con página de error propia cuando el slug no existe o el perfil
está pausado. En Premium, el diseño se elige entre cuatro variantes.

**Enlace corto** (`/t/<codigo>`) — lo que se graba en el chip. Resuelve el código
contra la base y redirige al perfil.

**Panel del cliente** (`/panel`) — Plus y Premium. Ingreso por email (enlace de
un solo uso o contraseña), edición de datos, botones, datos de contacto, fotos
con recorte y vista previa. En Premium, además, estadísticas.

**Alta de cuenta** (`/crear-cuenta`) — el cliente se crea la cuenta solo.
Crearla no le da acceso a nada: sin un perfil vinculado, RLS no le devuelve una
sola fila. El alta real —vincular la cuenta con un perfil— la hacemos nosotros
desde el backoffice, donde las cuentas pendientes aparecen listadas.

**Backoffice** (`/admin`) — alta de perfiles, asignación de plan, de slug y de
color, edición de cualquier perfil (es como operamos el Básico), pausar y
reactivar, vincular la cuenta del cliente (incluidas las que se crearon solas y
están esperando), registro de tarjetas físicas entregadas y métricas.

**Páginas legales** (`/privacidad`, `/terminos`, `/cookies`).

## Privacidad: la decisión que atraviesa todo el producto

**La analítica no usa cookies ni guarda ningún dato del visitante.** No se
guarda la IP, ni el user-agent, ni un identificador de dispositivo o de sesión.
Del referrer se conserva sólo el dominio, nunca la URL completa. La escritura de
eventos pasa por un único RPC (`registrar_evento`) que valida y normaliza: la
tabla `events` no tiene política de `INSERT` para nadie.

Consecuencias, asumidas a propósito:

- No hay «visitantes únicos», sólo totales. Sería un número inventado.
- **No hace falta cartel de consentimiento de cookies.** Las únicas cookies del
  sitio son las de sesión de `/admin` y `/panel`, que son estrictamente
  necesarias para un servicio que el usuario pidió, y están exceptuadas del
  consentimiento previo. Está explicado en `/cookies`.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS + Storage) · Vercel.
Sin framework de CSS: la página pública se abre desde un celular en la calle y
cada kilobyte cuenta. La única fuente web es Newsreader, autoalojada por
`next/font` — el navegador del visitante no le pide nada a Google.

## Arranque local

```bash
npm install
cp .env.example .env.local     # completar con las claves del proyecto Supabase
npm run dev
```

Para crear el proyecto Supabase, aplicar el esquema y darte de alta como admin,
seguí [`docs/SUPABASE.md`](docs/SUPABASE.md). Para publicar,
[`docs/DEPLOY.md`](docs/DEPLOY.md). Antes de pasar del piloto a cobrar,
revisá las puertas operativas en
[`docs/LAUNCH_GATES_ARGENTINA.md`](docs/LAUNCH_GATES_ARGENTINA.md), incluido el
[procedimiento de continuidad e incidentes](docs/CONTINUIDAD_E_INCIDENTES.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run test:db` | Levanta un Postgres efímero, aplica las migraciones y verifica las políticas de RLS |
| `npm run test:vcard` | Verifica el formato del `.vcf` generado |

## Estructura

```
app/
  [slug]/page.tsx          Página pública del profesional
  [slug]/vcard/route.ts    Genera el .vcf (text/vcard, para que el teléfono lo abra)
  [slug]/no-disponible.tsx Error específico: slug inexistente o perfil pausado
  t/[codigo]/page.tsx      Enlace corto: lo que se graba en el chip NFC
  api/evento/route.ts      Registro de vistas y clics, sin datos del visitante
  panel/                   Panel de autoedición del cliente (Plus y Premium)
  admin/                   Backoffice nuestro
  ingresar/                Ingreso de clientes (enlace por email o contraseña)
  crear-cuenta/            Alta de cuenta del cliente, inerte hasta vincularla
  login/                   Ingreso de administradores
  auth/callback/           Aterrizaje del enlace de un solo uso
  acceso/                  "No tenés tarjeta" / "tu plan no incluye panel"
  privacidad|terminos|cookies/
components/
  perfil/Perfil.tsx        La página del profesional, en sus cuatro variantes
  SubirFoto.tsx            Carga y recorte de foto de perfil y portada
  EditorLinks.tsx          Editor de botones, compartido por los dos paneles
  Metricas.tsx             Panel de estadísticas, compartido por los dos paneles
lib/
  marca.ts                 Marca, planes, precios, datos legales y WhatsApp
  paletas.ts               Las seis paletas de color
  types.ts                 Planes, capacidades por plan y tipos de datos
  links.ts                 Cómo se arma el href de cada tipo de link
  vcard.ts                 Generación de vCard 3.0
supabase/
  migrations/              Esquema y políticas de RLS
  seed.sql                 Perfil de demostración
  tests/01_rls.sql         Recorrido de las políticas, para leer con los ojos
  tests/02_asserts.sql     Aserciones que hacen fallar la CI si algo se rompe
```

## Decisiones que conviene conocer antes de tocar el código

**Todo lo visible sale de `lib/marca.ts`.** El nombre del proyecto sigue en
revisión, así que no hay ni un «TakeMyCard» escrito en un componente: el logo, los
textos, los metadatos y las páginas legales leen de esa constante. Cambiar el
nombre es editar una línea.

**El plan es el único switch.** `lib/types.ts` declara `CAPACIDADES`, que dice
qué habilita cada plan; la base lo repite en sus políticas. No hay banderas
sueltas que puedan contradecirlo (había una, `auto_edicion_habilitada`, y se
eliminó justamente por eso).

**El chip apunta al código corto, no al slug.** `profiles.codigo_corto` es
inmutable —lo protege un trigger— y es lo que se graba. El slug sí puede
cambiar.

**La entrega física tiene un procedimiento de piloto.** La lista para programar,
probar y registrar las dos tarjetas, y los límites actuales ante pérdida o
reposición, está en [`docs/PILOT_NFC_OPERATIONS.md`](docs/PILOT_NFC_OPERATIONS.md).

**La página del profesional no sigue el modo oscuro del sistema.** Es una
tarjeta: tiene el color que eligió su dueño. Que se viera distinta según la
configuración del teléfono del otro sería lo contrario de lo que se compra.

**El recorte de fotos ocurre en el navegador.** Una foto de cámara pesa entre 3
y 8 MB; recortada antes de subir viajan unos 80 KB. El recorte es sobre
`<canvas>`, así que lo que el cliente encuadra es exactamente lo que se guarda.

**`links.valor` guarda el dato crudo, no el enlace final.** Se carga
`2664123456`, no `https://wa.me/...`. El `href` se arma en `lib/links.ts` según
el tipo. Alias/CBU no genera enlace: se muestra con botón de copiar.

**Nada usa la `service_role` key.** Los dos paneles operan con la sesión del
usuario, así que toda consulta pasa por RLS. Donde hizo falta más permiso
—buscar un usuario por email, registrar un evento— hay una función
`SECURITY DEFINER` acotada en vez de una llave maestra en el servidor web.

**El `.vcf` se genera en el servidor.** Un blob armado en el navegador no
siempre llega con `Content-Type: text/vcard`, y sin ese encabezado iOS descarga
el archivo en vez de ofrecer «Agregar a contactos».

**La página pública se cachea, y eso es lo que la hace resistente.** Una vez
visitada, la tarjeta sigue funcionando aunque Supabase se caiga. El detalle está
en [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Etapa del proyecto y páginas legales

El proyecto está en **modo piloto** (`MODO_PILOTO` en `lib/marca.ts`): un solo
cliente, sin cargo, sin comercialización. En esa etapa las páginas legales dicen
exactamente eso en lugar de publicar una identificación que todavía no existe, y
dan el email del proyecto como canal de contacto real. No se inventa nada y no se
muestran huecos.

`estadoLegal()` decide qué se publica:

| Estado | Cuándo | Qué se ve |
|---|---|---|
| `completo` | `LEGAL` tiene titular, CUIT, domicilio y email | La identificación completa. Sin aviso |
| `piloto` | Falta alguno y `MODO_PILOTO` está en `true` | Nota sobria: «etapa de prueba», con el email de contacto |
| `incompleto` | Falta alguno y `MODO_PILOTO` está en `false` | Aviso rojo de borrador sin publicar |

`completo` gana siempre, así que al cargar los datos el modo piloto se apaga
solo y no hay que acordarse de nada.

## Pendiente antes de lanzar comercialmente

- [ ] **Completar `LEGAL` en `lib/marca.ts`** (titular o razón social, CUIT y
      domicilio) y poner `MODO_PILOTO` en `false`. El email ya está cargado.
      Esto es lo que corresponde hacer *antes* de cobrarle a alguien: publicar
      precios al público sin identificar al oferente es el riesgo concreto.
- [ ] Dominio propio y `NEXT_PUBLIC_SITE_URL`, **antes** de mandar a imprimir.
- [ ] Definir precio de las tarjetas de repuesto.
- [ ] Definir medio de pago y cobro. Lo que sí está resuelto técnicamente: la
      falta de pago se maneja pausando el perfil (`activo = false`), que muestra
      un aviso sin romper la tarjeta física ni perder los datos.
- [ ] Definir si alguna función del producto usa IA. Hoy ninguna la usa, y los
      textos de venta no la mencionan.
