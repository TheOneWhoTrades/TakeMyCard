/**
 * Pruebas de las reglas de fotos de perfil.
 *
 * Estas rutas se reutilizan al guardar desde ambos paneles, al mostrar la
 * tarjeta y al generar una vCard. Si se relajaran por accidente, una URL
 * externa podría rastrear visitas o el servidor podría intentar descargarla.
 *
 *   npm run test:fotos
 */
import {
  fotoValidaDePerfil,
  perfilConFotosSeguras,
  rutaDeFotoPropia,
  rutasDeFotosPropias,
} from '@/lib/fotos'
import type { Profile } from '@/lib/types'

const base = 'https://proyecto-prueba.supabase.co'
const perfilId = '11111111-1111-1111-1111-111111111111'
const otroId = '22222222-2222-2222-2222-222222222222'
const propia = `${base}/storage/v1/object/public/fotos/${perfilId}/perfil-123.jpg`

process.env.NEXT_PUBLIC_SUPABASE_URL = base

const profile: Profile = {
  id: perfilId,
  slug: 'perfil-prueba',
  codigo_corto: 'prueba1',
  nombre: 'Perfil de prueba',
  profesion: null,
  bio: null,
  foto_url: propia,
  portada_url: 'https://imagenes.example/seguimiento.jpg',
  paleta: 'bosque',
  layout: 'estandar',
  plan: 'premium',
  user_id: null,
  activo: true,
  created_at: '',
  updated_at: '',
}

const saneado = perfilConFotosSeguras(profile)
const asserts: [string, boolean][] = [
  ['acepta una foto de la carpeta propia', fotoValidaDePerfil(propia, perfilId) === propia],
  ['rechaza una URL externa', fotoValidaDePerfil('https://imagenes.example/seguimiento.jpg', perfilId) === null],
  [
    'rechaza la foto de otro perfil',
    fotoValidaDePerfil(`${base}/storage/v1/object/public/fotos/${otroId}/ajena.jpg`, perfilId) === null,
  ],
  [
    'rechaza la misma ruta desde otro origen',
    fotoValidaDePerfil(`http://proyecto-prueba.supabase.co/storage/v1/object/public/fotos/${perfilId}/insegura.jpg`, perfilId) === null,
  ],
  [
    'rechaza traversal hacia otra carpeta',
    fotoValidaDePerfil(`${base}/storage/v1/object/public/fotos/${perfilId}/../${otroId}/ajena.jpg`, perfilId) === null,
  ],
  ['obtiene una ruta segura para borrar', rutaDeFotoPropia(propia, perfilId) === 'perfil-123.jpg'],
  ['nunca obtiene ruta para borrar una foto ajena', rutaDeFotoPropia(`${base}/storage/v1/object/public/fotos/${otroId}/ajena.jpg`, perfilId) === null],
  [
    'al borrar, conserva sólo rutas propias y sin duplicados',
    JSON.stringify(rutasDeFotosPropias([propia, propia, `${base}/storage/v1/object/public/fotos/${otroId}/ajena.jpg`], perfilId)) ===
      JSON.stringify(['perfil-123.jpg']),
  ],
  ['conserva foto propia al mostrar la tarjeta', saneado.foto_url === propia],
  ['oculta foto histórica externa al mostrar la tarjeta', saneado.portada_url === null],
]

let fallos = 0
for (const [nombre, ok] of asserts) {
  if (!ok) fallos++
  console.log(ok ? 'OK  ' : 'FAIL', nombre)
}

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLOS`)
process.exit(fallos ? 1 : 0)
