import type { LinkTipo } from '@/lib/types'

/**
 * Íconos de los botones de contacto.
 *
 * Reemplazan a los emojis: un emoji lo dibuja el sistema operativo, viene a
 * todo color y se ve distinto en cada teléfono, que es justo lo contrario de lo
 * que necesita una página que quiere parecer impresa. Estos son trazos finos en
 * el color del texto, así que acompañan a la tipografía en vez de pelearse con
 * ella, y funcionan igual en claro y en oscuro.
 *
 * Van en línea y no como archivo: son unos pocos bytes dentro del HTML y evitan
 * un pedido de red por ícono.
 */

const TRAZOS: Record<LinkTipo, React.ReactNode> = {
  whatsapp: (
    <>
      <path d="M3.5 20.5 4.9 16a8 8 0 1 1 3.1 3.1z" />
      <path d="M8.8 9c.2 1.2.8 2.3 1.7 3.2.9.9 2 1.5 3.2 1.7l.9-1.3 1.9.8-.4 1.7c-1.9.4-4-.5-5.6-2.1S8 9.6 8.4 7.7l1.7-.4.8 1.9z" />
    </>
  ),
  telefono: (
    <path d="M6.5 3.5 9 8l-2 1.6a12 12 0 0 0 5.4 5.4L14 13l4.5 2.5-1 3a2 2 0 0 1-2.2 1.2C9 18.6 5.4 15 3.3 9.7A2 2 0 0 1 4.5 7.5z" />
  ),
  email: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="m3 6.5 9 6 9-6" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M14.8 8.2h-1.3c-.8 0-1.3.5-1.3 1.3V11h2.4l-.4 2.4h-2V19" />
      <path d="M9.6 11H12" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10.5V16" />
      <circle cx="7.5" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.5 16v-5.5M11.5 12.6c0-1.2 1-2.1 2.2-2.1s2.3.9 2.3 2.1V16" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14.2 3.5v10.3a3.6 3.6 0 1 1-3.6-3.6c.3 0 .6 0 .9.1" />
      <path d="M14.2 3.5c.3 2.2 1.9 3.8 4.1 4" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="m10.4 9.4 4.6 2.6-4.6 2.6z" />
    </>
  ),
  web: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.7 5.7 3.7 9S14.4 18.5 12 21c-2.4-2.5-3.7-5.7-3.7-9S9.6 5.5 12 3z" />
    </>
  ),
  agenda: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
      <path d="M7.5 13.5h3v3h-3z" fill="currentColor" stroke="none" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21.5s7-6.1 7-11.1a7 7 0 1 0-14 0c0 5 7 11.1 7 11.1z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  alias_cbu: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M4.5 9.5V18M9.5 9.5V18M14.5 9.5V18M19.5 9.5V18" />
      <path d="M2.5 20.5h19" />
    </>
  ),
  otro: (
    <>
      <path d="M10 13.8a4 4 0 0 0 5.7 0l2.8-2.9a4 4 0 0 0-5.7-5.6l-1.2 1.2" />
      <path d="M14 10.2a4 4 0 0 0-5.7 0l-2.8 2.9a4 4 0 0 0 5.7 5.6l1.2-1.2" />
    </>
  ),
}

export function IconoLink({ tipo }: { tipo: LinkTipo }) {
  return (
    <svg
      className="boton__icono"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[tipo] ?? TRAZOS.otro}
    </svg>
  )
}
