# TakeMyCard

Plataforma link-in-bio multi-tenant para tarjetas personales con NFC, para
profesionales de San Luis, Argentina.

Cada profesional tiene una página pública en `tudominio.com/<slug>`. La tarjeta
física guarda esa URL y **nunca se reprograma**: todo lo que se actualiza pasa
por la base de datos.

## Qué hace

**Sitio comercial** (`/`) — qué es el producto, cómo funciona, comparación de
los tres planes y preguntas frecuentes. Todos los botones terminan en un
WhatsApp con el mensaje ya escrito. Es estático: no consulta la base.

**Página pública** (`/<slug>`) — foto, nombre, profesión y bio; botones de
contacto ordenables (WhatsApp, redes, web, agenda, ubicación, alias/CBU); botón
"Guardar contacto" que descarga un `.vcf`. Mobile-first, sin login, con página
de error propia cuando el slug no existe o el perfil está pausado.

**Panel de administración** (`/admin`) — login con Supabase Auth y ABM completo
de perfiles y links. Es para uso interno: prioriza cargar un cliente nuevo
rápido por encima de la estética.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS + Storage) · Vercel.
Sin framework de CSS: la página pública se abre desde un celular en la calle y
cada kilobyte cuenta. La única fuente web es Newsreader, autoalojada por
`next/font`.

## Arranque local

```bash
npm install
cp .env.example .env.local     # completar con las claves del proyecto Supabase
npm run dev
```

Para crear el proyecto Supabase, aplicar el esquema y darte de alta como admin,
seguí [`docs/SUPABASE.md`](docs/SUPABASE.md). Para publicar,
[`docs/DEPLOY.md`](docs/DEPLOY.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run test:db` | Levanta un Postgres efímero y verifica las políticas de RLS |
| `npm run test:vcard` | Verifica el formato del `.vcf` generado |

## Estructura

```
app/
  [slug]/page.tsx          Página pública del profesional
  [slug]/vcard/route.ts    Genera el .vcf (text/vcard, para que el teléfono lo abra)
  [slug]/no-disponible.tsx Error específico: slug inexistente o perfil pausado
  admin/                   Panel: listado, alta, edición, editor de links
  login/                   Login de administradores
lib/
  marca.ts                 Textos de venta, planes y WhatsApp (editar acá, no en los componentes)
  links.ts                 Cómo se arma el href de cada tipo de link
  vcard.ts                 Generación de vCard 3.0
  perfil.ts                Lectura del perfil público
  supabase/                Clientes de servidor y de navegador
supabase/
  migrations/              Esquema y políticas de RLS
  seed.sql                 Perfil de prueba con datos ficticios
  tests/                   Suite de verificación de RLS
```

## Decisiones que conviene conocer antes de tocar el código

**Los textos del sitio comercial viven en `lib/marca.ts`.** Los planes, las
preguntas frecuentes, el eslogan y el número de WhatsApp están todos en ese
archivo. Cambiar qué incluye un plan o corregir una redacción no requiere tocar
JSX: se edita una lista y listo.

**La estética es de diario, y eso se sostiene con variables.** Toda la paleta
está declarada como custom properties al principio de `app/globals.css`. El
panel de admin y el login no tienen estilos propios: consumen esas variables, así
que cambiar el verde de la marca en un solo lugar cambia el sitio entero.

**Los íconos son SVG en línea, no emojis.** Un emoji lo dibuja el sistema
operativo: viene a todo color y se ve distinto en cada teléfono. Los trazos de
`components/IconoLink.tsx` heredan el color del texto y funcionan igual en claro
y en oscuro.

**El `slug` es un compromiso físico.** Es lo único que la tarjeta impresa
conoce. Cambiarlo invalida todas las tarjetas ya entregadas de ese profesional.
Para dar de baja a un cliente se **pausa** (`activo = false`), no se elimina: el
slug queda reservado y quien tenga la tarjeta ve un mensaje claro.

**`links.valor` guarda el dato crudo, no el enlace final.** Se carga
`2664123456`, no `https://wa.me/...`. El `href` se arma en `lib/links.ts` según
el tipo. Alias/CBU no genera enlace: se muestra con botón de copiar, que es lo
que el visitante necesita hacer con un alias.

**Nada usa la `service_role` key.** El panel de admin opera con la sesión del
usuario, así que toda consulta pasa por RLS. Un bug en el panel no puede
convertirse en una fuga de datos de todos los clientes.

**El `.vcf` se genera en el servidor.** Un blob armado en el navegador no
siempre llega con `Content-Type: text/vcard`, y sin ese encabezado iOS descarga
el archivo en vez de ofrecer "Agregar a contactos".

**La página pública se cachea, y eso es lo que la hace resistente.** Una vez
visitada, la tarjeta sigue funcionando aunque Supabase se caiga. El detalle de
cómo y qué se pierde a cambio está en [`docs/DEPLOY.md`](docs/DEPLOY.md).

**La auto-edición del profesional todavía no existe**, pero el modelo de datos y
las políticas ya la contemplan (`auto_edicion_habilitada` + `user_id`). Ver la
sección correspondiente en [`docs/SUPABASE.md`](docs/SUPABASE.md).

## Fuera de alcance por ahora

Panel de auto-edición para el profesional · cobros y suscripciones · secciones
de portfolio/testimonios (producto premium) · landing personalizada del plan
premium.
