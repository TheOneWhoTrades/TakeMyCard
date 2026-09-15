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
      <span className="boton__icono" aria-hidden="true">
        📇
      </span>
      <span className="boton__texto">Guardar contacto</span>
    </a>
  )
}
