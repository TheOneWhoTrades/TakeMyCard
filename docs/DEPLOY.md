# Deploy en Vercel

## Por qué Vercel y no GitHub Pages

GitHub Pages sirve archivos estáticos: no ejecuta código en el servidor. Este
proyecto necesita las dos cosas que eso descarta:

- **Rutas dinámicas server-side.** `/[slug]` se resuelve consultando la base en
  cada visita. En un sitio estático habría que regenerar y publicar el sitio
  entero cada vez que se corrige un teléfono.
- **Variables de entorno del lado del servidor.** La sesión del panel se maneja
  con cookies HTTP-only que sólo puede escribir un servidor.

Además, `/[slug]/vcard` tiene que responder con `Content-Type: text/vcard` para
que el teléfono abra el diálogo de "Agregar contacto"; un hosting estático no
permite controlar ese encabezado.

## Pasos

1. **Importar el repositorio** en [vercel.com/new](https://vercel.com/new).
   Vercel detecta Next.js solo: no hay que tocar build command ni output
   directory.

2. **Cargar las variables de entorno** (*Settings → Environment Variables*),
   marcando los tres ambientes (Production, Preview, Development):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | *Project Settings → API → Project URL* |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Project Settings → API → anon public* |
   | `NEXT_PUBLIC_SITE_URL` | La URL final del sitio, sin barra al final |

   `NEXT_PUBLIC_SITE_URL` se puede omitir al principio: si falta, se usa la URL
   que asigna Vercel. Conviene fijarla cuando se conecte el dominio propio,
   porque es la que se escribe dentro del archivo `.vcf` y en los metadatos que
   se ven al compartir el link por WhatsApp.

   > La `anon key` es pública por diseño: viaja al navegador en cualquier app de
   > Supabase. Lo que protege los datos es RLS, no el secreto de la clave. La
   > `service_role` key **no se usa en este proyecto** y no debe cargarse acá.

3. **Deploy.** Cada push a la rama por defecto publica a producción; cada PR
   genera un preview con su propia URL.

4. **Verificar** — con el perfil de prueba del seed cargado:
   - `https://<tu-deploy>.vercel.app/dra-lucia-fernandez` muestra el perfil
   - el botón "Guardar contacto" descarga un `.vcf` que el teléfono ofrece
     agregar a la agenda
   - `https://<tu-deploy>.vercel.app/slug-que-no-existe` muestra el aviso
     específico y no un 404 genérico
   - `https://<tu-deploy>.vercel.app/login` entra al panel

## Dominio propio

*Settings → Domains → Add*, y cargar en el DNS del registrador lo que Vercel
indique. Después actualizar `NEXT_PUBLIC_SITE_URL` y **volver a deployar** (la
variable se lee en build time).

Conviene hacerlo **antes de mandar a imprimir las tarjetas**: la URL grabada en
el chip no se cambia después, así que las tarjetas impresas con el subdominio de
Vercel quedan atadas a él para siempre.

## Cómo se cachea (y qué pasa si Supabase se cae)

- `/[slug]` se genera la primera vez que alguien la visita y después se sirve
  desde el caché, revalidando cada 60 segundos. La tarjeta abre instantáneo y
  una corrección hecha en el panel se ve al minuto, sin redeployar.
- Guardar desde el panel invalida el caché de esa página (`revalidatePath`), así
  que en la práctica el cambio se ve enseguida.
- `/admin` y `/login` nunca se cachean.

Para que esto funcione, `app/[slug]/page.tsx` declara `generateStaticParams`
devolviendo una lista vacía. Suena raro, pero es necesario: sin esa
declaración Next sirve el segmento dinámico en cada request y `revalidate = 60`
no tiene ningún efecto. La lista va vacía a propósito — no queremos
prerenderizar perfiles durante el build, porque cambian desde el panel.

**El efecto colateral es la mejor propiedad del sistema.** Si Supabase se cae,
una tarjeta que ya fue visitada alguna vez **sigue funcionando**: se sirve la
versión cacheada (`stale-while-revalidate`) hasta que el servicio vuelve. Está
verificado: con la base apagada, la página responde 200 con el contenido
correcto incluso después de vencido el minuto de revalidación.

La contracara, que conviene conocer: un slug que **nunca** fue visitado y que se
pide justo durante una caída de Supabase devuelve un **500 pelado**, sin página
de error linda. Bajo generación estática, Next no puede usar un `error.tsx` —
el render falla y no hay boundary que lo tome. Se aceptó a cambio de la
resiliencia de arriba, porque requiere que dos cosas raras pasen a la vez
(tarjeta estrenada + caída de la base). Si alguna vez molesta, la salida es
pre-generar los perfiles activos con `generateStaticParams` de verdad y
regenerar desde el panel.

Los slugs inexistentes o pausados **sí** muestran la página de aviso, porque eso
no es un fallo: la base contestó.

## Costos

Con decenas o pocos cientos de perfiles, el plan gratuito de Vercel y el de
Supabase alcanzan de sobra. El límite a vigilar en Supabase es la **pausa por
inactividad** del plan gratuito: un proyecto sin tráfico durante una semana se
suspende y las tarjetas dejan de resolver. Con clientes reales usándolo eso no
pasa, pero durante la etapa piloto conviene tenerlo presente.
