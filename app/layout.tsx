import type { Metadata, Viewport } from 'next'
import { Newsreader } from 'next/font/google'
import { MARCA } from '@/lib/marca'
import { siteUrl } from '@/lib/env'
import './globals.css'

/**
 * Newsreader es una serif diseñada para leer noticias en pantalla: es la que
 * sostiene la estética de diario de todo el sitio.
 *
 * Se carga como fuente variable (un solo archivo cubre todos los grosores) y
 * autoalojada por next/font, así que no hay pedido a Google desde el navegador
 * del visitante: menos latencia y nada que se rompa si el cliente está en una
 * conexión mala. `display: swap` deja el texto visible con la serif del sistema
 * mientras la fuente termina de bajar.
 */
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-serif',
  // Georgia primero: es la serif de sistema más parecida en ancho, así que el
  // salto cuando entra la fuente real casi no se nota.
  fallback: ['Iowan Old Style', 'Georgia', 'Times New Roman', 'serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${MARCA.nombre} · Tarjetas personales con NFC en ${MARCA.ciudad}`,
    template: `%s · ${MARCA.nombre}`,
  },
  description:
    `Tarjetas personales con chip NFC para profesionales de ${MARCA.ciudad}. ` +
    'La acercás a un celular y se abre tu página: tus contactos, tus redes y tu ' +
    'agenda, sin apps y sin tipear nada.',
  applicationName: MARCA.nombre,
  openGraph: {
    type: 'website',
    siteName: MARCA.nombre,
    locale: 'es_AR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    // Los mismos valores que --papel en cada esquema, para que la barra del
    // navegador no corte con un color distinto al del fondo.
    { media: '(prefers-color-scheme: light)', color: '#f2ede3' },
    { media: '(prefers-color-scheme: dark)', color: '#14120f' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={newsreader.variable}>
      <body>{children}</body>
    </html>
  )
}
