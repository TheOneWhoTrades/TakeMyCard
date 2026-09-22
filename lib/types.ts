/** Los tres planes del brief. El plan es el switch de diseño y de funciones. */
export const PLANES_ID = ['basico', 'plus', 'premium'] as const
export type Plan = (typeof PLANES_ID)[number]

/**
 * Qué habilita cada plan. Una sola definición para toda la app: si mañana el
 * Plus suma analítica, se cambia acá y cambia la base, el panel y la página
 * pública a la vez.
 *
 * Ojo: esto es la verdad para la interfaz, no la que protege los datos. Lo que
 * de verdad impide que un básico lea métricas son las políticas de RLS.
 */
export const CAPACIDADES: Record<Plan, {
  portada: boolean
  autoEdicion: boolean
  analytics: boolean
  landingPropia: boolean
}> = {
  basico:  { portada: false, autoEdicion: false, analytics: false, landingPropia: false },
  plus:    { portada: true,  autoEdicion: true,  analytics: false, landingPropia: false },
  premium: { portada: true,  autoEdicion: true,  analytics: true,  landingPropia: true },
}

/** Variantes de diseño. Las que no son 'estandar' son exclusivas del premium. */
export const LAYOUTS = ['estandar', 'editorial', 'retrato', 'vidriera'] as const
export type Layout = (typeof LAYOUTS)[number]

export const LINK_TIPOS = [
  'whatsapp',
  'telefono',
  'email',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'web',
  'agenda',
  'ubicacion',
  'alias_cbu',
  'otro',
] as const

export type LinkTipo = (typeof LINK_TIPOS)[number]

export type Profile = {
  id: string
  slug: string
  /** Lo que se graba en el chip: /t/<codigo_corto>. No cambia nunca. */
  codigo_corto: string
  nombre: string
  /** El «cargo» del brief. */
  profesion: string | null
  bio: string | null
  foto_url: string | null
  /** Foto de portada tipo LinkedIn. Sólo se muestra en plus y premium. */
  portada_url: string | null
  /** Id de una de las seis paletas de lib/paletas.ts. */
  paleta: string
  layout: Layout
  plan: Plan
  user_id: string | null
  /** El «estado» del brief: activo o pausado. */
  activo: boolean
  created_at: string
  updated_at: string
}

export type Link = {
  id: string
  profile_id: string
  tipo: LinkTipo
  /** La «etiqueta» del brief: el texto del botón. */
  label: string
  valor: string
  orden: number
  /** El «visible» del brief. */
  activo: boolean
  created_at: string
}

/**
 * Datos de contacto para la vCard. Son públicos por diseño: es la información
 * que el profesional reparte en su tarjeta.
 */
export type ContactInfo = {
  profile_id: string
  telefono: string | null
  email: string | null
  direccion: string | null
  redes: Record<string, string>
  created_at: string
  updated_at: string
}

/** Tarjeta física entregada. Registro interno, nunca sale a la página pública. */
export type Card = {
  id: string
  profile_id: string
  entregada_el: string | null
  reposicion: boolean
  nota: string | null
  created_at: string
}

/** Una fila del panel de estadísticas (RPC `metricas_perfil`). */
export type Metrica = {
  link_id: string | null
  etiqueta: string
  vistas: number
  clics: number
}

export function esPlan(valor: unknown): valor is Plan {
  return typeof valor === 'string' && (PLANES_ID as readonly string[]).includes(valor)
}

export function esLayout(valor: unknown): valor is Layout {
  return typeof valor === 'string' && (LAYOUTS as readonly string[]).includes(valor)
}
