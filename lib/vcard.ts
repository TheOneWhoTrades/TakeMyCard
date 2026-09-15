import type { Link, Profile } from './types'
import { hrefDeLink } from './links'

/** Escapa según RFC 6350 §3.4: coma, punto y coma, barra y salto de línea. */
function esc(valor: string): string {
  return valor
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\;')
}

/**
 * Parte el nombre completo en apellido / nombre para el campo N.
 * Heurística simple: la última palabra es el apellido. Se ignoran los títulos
 * ("Dr.", "Lic.") para que la agenda del teléfono no ordene por ellos.
 */
function partirNombre(nombre: string): { nombre: string; apellido: string } {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => !/^(dr|dra|lic|ing|arq|cr|cra|prof|mg|esp)\.?$/i.test(p))
  if (partes.length < 2) return { nombre: partes[0] ?? nombre, apellido: '' }
  return { nombre: partes.slice(0, -1).join(' '), apellido: partes[partes.length - 1] }
}

/**
 * Sanea el valor de un parámetro (p. ej. TYPE=...). vCard 3.0 sólo admite
 * ASCII sin espacios ni signos ahí: "Ubicación" o "Pedir turno" rompen parsers
 * estrictos. Se reduce a letras, números y guiones.
 */
function param(valor: string): string {
  const limpio = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
  return limpio || 'Link'
}

/** Las líneas de vCard se pliegan a 75 octetos, continuando con un espacio. */
function plegar(linea: string): string[] {
  const bytes = Buffer.from(linea, 'utf8')
  if (bytes.length <= 75) return [linea]

  const salida: string[] = []
  let inicio = 0
  let limite = 75
  while (inicio < bytes.length) {
    let fin = Math.min(inicio + limite, bytes.length)
    // No cortar en medio de un carácter multibyte.
    while (fin > inicio && fin < bytes.length && (bytes[fin] & 0xc0) === 0x80) fin--
    salida.push((salida.length ? ' ' : '') + bytes.subarray(inicio, fin).toString('utf8'))
    inicio = fin
    limite = 74
  }
  return salida
}

/**
 * Genera el contenido de un archivo .vcf (vCard 3.0) a partir del perfil.
 *
 * Se usa 3.0 y no 4.0 a propósito: es el formato que iOS Contactos y Android
 * importan sin fricción. 4.0 todavía tiene soporte desparejo en móviles, que es
 * exactamente el escenario de uso de la tarjeta NFC.
 *
 * `fotoBase64` es opcional: embeber la imagen hace que el contacto guardado
 * sobreviva aunque el bucket cambie, pero es caro, así que quien llama decide.
 */
export function generarVCard(
  profile: Profile,
  links: Link[],
  opciones: { urlPerfil: string; fotoBase64?: { datos: string; mime: string } | null } = {
    urlPerfil: '',
  },
): string {
  const { nombre, apellido } = partirNombre(profile.nombre)
  const lineas: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

  lineas.push(`N:${esc(apellido)};${esc(nombre)};;;`)
  lineas.push(`FN:${esc(profile.nombre)}`)

  if (profile.profesion) {
    lineas.push(`TITLE:${esc(profile.profesion)}`)
    lineas.push(`ORG:${esc(profile.profesion)}`)
  }
  // vCard 3.0 admite un solo NOTE: se junta todo (bio + alias/CBU) y se emite
  // una vez al final. Emitir varios hace que algunas agendas guarden sólo el
  // primero y se pierda el alias.
  const notas: string[] = []
  if (profile.bio) notas.push(profile.bio)

  // Un solo teléfono por número: si WhatsApp y Teléfono coinciden, no duplicar.
  const telefonosVistos = new Set<string>()

  for (const link of links) {
    const valor = link.valor.trim()
    const href = hrefDeLink(link)

    switch (link.tipo) {
      case 'whatsapp':
      case 'telefono': {
        const numero = (href ?? '').replace(/^tel:/, '').replace('https://wa.me/', '')
        const e164 = numero.startsWith('+') ? numero : `+${numero}`
        if (telefonosVistos.has(e164)) break
        telefonosVistos.add(e164)
        lineas.push(`TEL;TYPE=CELL,VOICE:${e164}`)
        break
      }
      case 'email':
        lineas.push(`EMAIL;TYPE=INTERNET:${esc(valor)}`)
        break
      case 'ubicacion':
        // Sin parsear la dirección en componentes: va entera en el campo calle,
        // que es como la muestran las agendas de los teléfonos.
        lineas.push(`ADR;TYPE=WORK:;;${esc(valor)};;;;`)
        if (href) lineas.push(`URL;TYPE=${param('Ubicacion')}:${esc(href)}`)
        break
      case 'alias_cbu':
        notas.push(`${link.label}: ${valor}`)
        break
      default:
        if (href) lineas.push(`URL;TYPE=${param(link.label)}:${esc(href)}`)
        break
    }
  }

  if (opciones.urlPerfil) lineas.push(`URL;TYPE=${param('Tarjeta digital')}:${esc(opciones.urlPerfil)}`)

  if (notas.length) lineas.push(`NOTE:${esc(notas.join('\n'))}`)

  if (opciones.fotoBase64) {
    const tipo = opciones.fotoBase64.mime.split('/')[1]?.toUpperCase() ?? 'JPEG'
    lineas.push(`PHOTO;ENCODING=b;TYPE=${tipo}:${opciones.fotoBase64.datos}`)
  }

  lineas.push(`REV:${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`)
  lineas.push('END:VCARD')

  // CRLF obligatorio: iOS rechaza en silencio los .vcf con LF solo.
  return lineas.flatMap(plegar).join('\r\n') + '\r\n'
}

/** Nombre de archivo seguro para el .vcf. */
export function nombreArchivoVCard(profile: Profile): string {
  return `${profile.slug}.vcf`
}
