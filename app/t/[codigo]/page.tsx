import Link from 'next/link'
import { redirect } from 'next/navigation'
import { linkWhatsapp, MARCA, MENSAJES } from '@/lib/marca'
import { supabasePublico } from '@/lib/supabase/public'

/**
 * El enlace corto: lo que se graba en el chip NFC.
 *
 * El brief lo marca como importante y la razón es concreta: un chip NFC no se
 * reprograma una vez entregado. Si la tarjeta apuntara a `dominio.com/juan-perez`
 * quedaríamos atados para siempre a ese dominio y a esa estructura de URL. Como
 * apunta a `/t/<codigo>`, podemos cambiar el dominio, el slug del profesional o
 * la forma de las páginas, y las tarjetas que ya están en la calle siguen
 * llevando al lugar correcto.
 *
 * El código se resuelve contra la base en cada visita --no se cachea-- porque
 * el slug puede cambiar y una redirección cacheada apuntando al slug viejo es
 * exactamente el problema que esto viene a evitar.
 */
export const dynamic = 'force-dynamic'

export const metadata = { robots: { index: false, follow: false } }

type Props = { params: Promise<{ codigo: string }> }

export default async function RedireccionTarjeta({ params }: Props) {
  const { codigo } = await params

  let slug: string | null = null
  let servicioDisponible = true
  try {
    const { data, error } = await supabasePublico().rpc('slug_por_codigo', { p_codigo: codigo })
    if (error) throw error
    slug = typeof data === 'string' ? data : null
  } catch {
    // La base no contestó. Es importante no presentarlo como si el chip fuera
    // inválido: la persona acaba de apoyar una tarjeta que puede estar bien.
    servicioDisponible = false
  }

  // Fuera del try: `redirect` funciona lanzando una excepción, y un catch la
  // atraparía convirtiendo la redirección en el mensaje de error.
  if (slug) redirect(`/${slug}`)

  if (!servicioDisponible) {
    return (
      <main className="aviso">
        <p className="aviso__emoji">⏳</p>
        <h1 className="aviso__titulo">Esta tarjeta está temporalmente indisponible</h1>
        <p className="aviso__texto">
          No pudimos abrirla ahora. Probá de nuevo en unos minutos.
        </p>
        <p style={{ marginTop: '2rem' }}>
          <Link href="/" className="btn">
            Ir al inicio
          </Link>
        </p>
      </main>
    )
  }

  return (
    <main className="aviso">
      <p className="aviso__emoji">🔍</p>
      <h1 className="aviso__titulo">No encontramos esta tarjeta</h1>
      <p className="aviso__texto">
        El código <strong>{codigo.slice(0, 16)}</strong> no corresponde a ninguna tarjeta
        de {MARCA.nombre}. Puede que esté mal escrito.
      </p>
      <p
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '0.6rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <a
          className="btn btn--primario"
          href={linkWhatsapp(MENSAJES.codigoRoto(codigo.slice(0, 16)))}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribirnos
        </a>
        <Link href="/" className="btn">
          Ir al inicio
        </Link>
      </p>
    </main>
  )
}
