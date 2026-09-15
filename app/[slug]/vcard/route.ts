import { siteUrl } from '@/lib/env'
import { obtenerPerfilPublico } from '@/lib/perfil'
import { generarVCard, nombreArchivoVCard } from '@/lib/vcard'

/** Límite para embeber la foto en el .vcf. Por encima se omite y el contacto
 *  se guarda sin imagen, que es mejor que un archivo que el teléfono descarta. */
const MAX_FOTO_BYTES = 500 * 1024

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  let resultado
  try {
    resultado = await obtenerPerfilPublico(slug)
  } catch {
    // La base no contestó. 503 y no 404: el perfil puede existir perfectamente.
    return new Response('No se pudo generar el contacto. Probá de nuevo.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  if (resultado.estado !== 'activo') {
    return new Response('Perfil no disponible', { status: 404 })
  }

  const { profile, links } = resultado

  let fotoBase64: { datos: string; mime: string } | null = null
  if (profile.foto_url) {
    try {
      const respuesta = await fetch(profile.foto_url, { signal: AbortSignal.timeout(3000) })
      const mime = respuesta.headers.get('content-type') ?? ''
      if (respuesta.ok && mime.startsWith('image/')) {
        const buffer = Buffer.from(await respuesta.arrayBuffer())
        if (buffer.byteLength <= MAX_FOTO_BYTES) {
          fotoBase64 = { datos: buffer.toString('base64'), mime }
        }
      }
    } catch {
      // Foto inaccesible o lenta: se genera la vCard sin ella.
    }
  }

  const vcard = generarVCard(profile, links, {
    urlPerfil: `${siteUrl()}/${profile.slug}`,
    fotoBase64,
  })

  return new Response(vcard, {
    headers: {
      // text/vcard es lo que dispara el diálogo "Agregar a contactos" en iOS.
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivoVCard(profile)}"`,
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
