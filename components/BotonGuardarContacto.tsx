'use client'

/**
 * Descarga el .vcf. Se genera del lado del servidor (ver app/[slug]/vcard) para
 * que el archivo llegue con el Content-Type correcto: iOS y Android sólo abren
 * el diálogo de "Agregar contacto" si el tipo MIME es text/vcard, cosa que un
 * blob generado en el navegador no siempre consigue.
 */
export function BotonGuardarContacto({ slug, nombre }: { slug: string; nombre: string }) {
  return (
    <a
      className="boton boton--principal"
      href={`/${slug}/vcard`}
      download={`${slug}.vcf`}
      aria-label={`Guardar el contacto de ${nombre} en la agenda`}
    >
      {/* Ficha de contacto, al mismo trazo que el resto de los íconos. */}
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
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
        <circle cx="9" cy="11" r="2.2" />
        <path d="M5.6 16.4a3.8 3.8 0 0 1 6.8 0M15 9.5h3.5M15 13h3.5" />
      </svg>
      <span className="boton__texto">Guardar contacto</span>
    </a>
  )
}
