import Link from 'next/link'
import { MARCA } from '@/lib/marca'

/** Pie del sitio comercial. Es donde viven los links legales obligatorios. */
export function PieSitio() {
  return (
    <footer className="pie">
      <p>
        © {new Date().getFullYear()} {MARCA.nombre} · {MARCA.provincia}
      </p>
      <nav className="pie__links">
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/terminos">Términos</Link>
        <Link href="/cookies">Cookies</Link>
        <Link href="/ingresar">Ingresar a mi panel</Link>
      </nav>
    </footer>
  )
}
