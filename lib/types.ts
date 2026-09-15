export type Plan = 'basico' | 'premium'

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
  nombre: string
  profesion: string | null
  bio: string | null
  foto_url: string | null
  plan: Plan
  auto_edicion_habilitada: boolean
  user_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type Link = {
  id: string
  profile_id: string
  tipo: LinkTipo
  label: string
  valor: string
  orden: number
  activo: boolean
  created_at: string
}
