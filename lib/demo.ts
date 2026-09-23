import { SLUG_DEMO } from '@/lib/marca'
import type { PerfilCompleto } from '@/lib/perfil'

/**
 * Respaldo público para la CTA «Ver una tarjeta de ejemplo».
 *
 * En producción no se puede depender de que el seed de una base concreta se
 * haya ejecutado: la landing es estática y una CTA rota en su portada impide
 * justamente mostrar el producto. Si existe el perfil del seed, éste tiene
 * prioridad; esta ficha ficticia sólo aparece mientras no exista.
 */
const PROFILE_ID = '00000000-0000-4000-8000-000000000001'

export const DEMO_PUBLICA: PerfilCompleto = {
  profile: {
    id: PROFILE_ID,
    slug: SLUG_DEMO,
    codigo_corto: 'demotmc1',
    nombre: 'Estudio Ejemplo',
    profesion: 'Contadores Públicos · Impuestos y sociedades',
    bio: 'Este es un ejemplo ficticio de cómo se ven tus datos, tus botones y tu contacto al acercar una tarjeta.',
    foto_url: null,
    portada_url: null,
    paleta: 'bosque',
    layout: 'editorial',
    plan: 'premium',
    user_id: null,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  links: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      profile_id: PROFILE_ID,
      tipo: 'whatsapp',
      label: 'Escribinos por WhatsApp',
      valor: '2664123456',
      orden: 1,
      activo: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '00000000-0000-4000-8000-000000000012',
      profile_id: PROFILE_ID,
      tipo: 'agenda',
      label: 'Pedir turno',
      valor: 'https://calendly.com/estudio-demo',
      orden: 2,
      activo: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '00000000-0000-4000-8000-000000000013',
      profile_id: PROFILE_ID,
      tipo: 'ubicacion',
      label: 'Cómo llegar',
      valor: 'Av. Illia 350, San Luis, Argentina',
      orden: 3,
      activo: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  contacto: {
    profile_id: PROFILE_ID,
    telefono: '2664123456',
    email: 'contacto@ejemplo.com.ar',
    direccion: 'Av. Illia 350, San Luis, Argentina',
    redes: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
}

export function esDemoPublica(slug: string): boolean {
  return slug === SLUG_DEMO
}
