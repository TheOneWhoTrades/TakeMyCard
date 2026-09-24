import type { Link, LinkTipo } from './types'

/**
 * Qué se guarda en `links.valor` según el tipo, y cómo se muestra.
 * El panel de admin usa `placeholder` y `ayuda` como guía de carga.
 */
export const LINK_META: Record<
  LinkTipo,
  { nombre: string; icono: string; placeholder: string; ayuda: string }
> = {
  whatsapp:  { nombre: 'WhatsApp',   icono: '💬', placeholder: '2664123456',                 ayuda: 'Número con característica, sin 0 ni 15.' },
  telefono:  { nombre: 'Teléfono',   icono: '📞', placeholder: '2664123456',                 ayuda: 'Número con característica.' },
  email:     { nombre: 'Email',      icono: '✉️', placeholder: 'hola@ejemplo.com',           ayuda: 'Dirección de correo.' },
  instagram: { nombre: 'Instagram',  icono: '📸', placeholder: 'usuario',                    ayuda: 'Usuario sin @, o la URL completa.' },
  facebook:  { nombre: 'Facebook',   icono: '👥', placeholder: 'usuario',                    ayuda: 'Usuario o URL completa.' },
  linkedin:  { nombre: 'LinkedIn',   icono: '💼', placeholder: 'in/usuario',                 ayuda: 'Ruta del perfil o URL completa.' },
  tiktok:    { nombre: 'TikTok',     icono: '🎵', placeholder: 'usuario',                    ayuda: 'Usuario sin @, o la URL completa.' },
  youtube:   { nombre: 'YouTube',    icono: '▶️', placeholder: '@canal',                     ayuda: 'Canal o URL completa.' },
  web:       { nombre: 'Sitio web',  icono: '🌐', placeholder: 'https://ejemplo.com.ar',     ayuda: 'URL completa.' },
  agenda:    { nombre: 'Agenda / turnos', icono: '📅', placeholder: 'https://calendly.com/…', ayuda: 'URL del sistema de turnos.' },
  ubicacion: { nombre: 'Ubicación',  icono: '📍', placeholder: 'Av. Illia 350, San Luis',    ayuda: 'Dirección, o URL de Google Maps.' },
  alias_cbu: { nombre: 'Alias / CBU', icono: '🏦', placeholder: 'mi.alias.mp',               ayuda: 'No es un link: se muestra con botón de copiar.' },
  otro:      { nombre: 'Otro',       icono: '🔗', placeholder: 'https://…',                  ayuda: 'URL completa.' },
}

const empiezaComoUrl = (valor: string) => /^https?:\/\//i.test(valor.trim())

/** Devuelve sólo destinos HTTP(S) que el navegador pueda interpretar. */
function urlSegura(valor: string): string | null {
  try {
    const url = new URL(valor.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Completa HTTPS para un dominio escrito sin protocolo y lo vuelve a validar. */
function urlConHttps(valor: string): string | null {
  const limpia = valor.trim()
  return urlSegura(empiezaComoUrl(limpia) ? limpia : `https://${limpia.replace(/^\/+/, '')}`)
}

/** Deja sólo dígitos y le antepone el código de país argentino si falta. */
function telefonoInternacional(valor: string): string {
  const digitos = valor.replace(/\D/g, '').replace(/^0+/, '')
  if (digitos.startsWith('54')) return digitos
  // Los móviles argentinos se marcan +54 9 <área> <número> desde el exterior,
  // que es como WhatsApp los espera. El 15 local no va.
  return `549${digitos.replace(/^15/, '')}`
}

const usuario = (valor: string) => valor.trim().replace(/^@/, '').replace(/\/+$/, '')

/**
 * Construye el href a partir del tipo y el valor crudo.
 * Devuelve `null` para los tipos que no son navegables (alias/CBU), que la UI
 * renderiza como botón de "copiar" en vez de como enlace.
 */
export function hrefDeLink(link: Pick<Link, 'tipo' | 'valor'>): string | null {
  const valor = link.valor.trim()

  switch (link.tipo) {
    case 'whatsapp':
      return empiezaComoUrl(valor) ? urlSegura(valor) : `https://wa.me/${telefonoInternacional(valor)}`
    case 'telefono':
      return `tel:+${telefonoInternacional(valor)}`
    case 'email':
      return `mailto:${valor}`
    case 'instagram':
      return empiezaComoUrl(valor) ? urlSegura(valor) : `https://instagram.com/${usuario(valor)}`
    case 'facebook':
      return empiezaComoUrl(valor) ? urlSegura(valor) : `https://facebook.com/${usuario(valor)}`
    case 'linkedin':
      return empiezaComoUrl(valor)
        ? urlSegura(valor)
        : `https://linkedin.com/${usuario(valor).replace(/^linkedin\.com\//, '')}`
    case 'tiktok':
      return empiezaComoUrl(valor) ? urlSegura(valor) : `https://tiktok.com/@${usuario(valor)}`
    case 'youtube':
      return empiezaComoUrl(valor)
        ? urlSegura(valor)
        : `https://youtube.com/${valor.trim().startsWith('@') ? valor.trim() : `@${usuario(valor)}`}`
    case 'ubicacion':
      return empiezaComoUrl(valor)
        ? urlSegura(valor)
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(valor)}`
    case 'alias_cbu':
      return null
    case 'web':
    case 'agenda':
    case 'otro':
    default:
      return urlConHttps(valor)
  }
}

/** Alias/CBU es el único tipo que admite un valor sin URL navegable. */
export function valorDeLinkValido(tipo: LinkTipo, valor: string): boolean {
  return tipo === 'alias_cbu' || hrefDeLink({ tipo, valor }) !== null
}

/** Los links externos se abren en pestaña nueva; tel:/mailto: no. */
export function esExterno(href: string): boolean {
  return /^https?:\/\//i.test(href)
}
