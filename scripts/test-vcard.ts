/**
 * Verifica la generación del .vcf. La vCard es la parte del producto con más
 * reglas de formato escondidas (CRLF obligatorio, plegado a 75 octetos, un solo
 * NOTE, parámetros TYPE en ASCII) y es lo que más se rompe en silencio: el
 * teléfono simplemente no abre el archivo y nadie se entera.
 *
 *   npm run test:vcard
 */
import { generarVCard } from '@/lib/vcard'
import { hrefDeLink } from '@/lib/links'
import type { Link, Profile } from '@/lib/types'

const profile: Profile = {
  id: 'p1', slug: 'dra-lucia-fernandez', nombre: 'Dra. Lucía Fernández',
  profesion: 'Odontóloga · Ortodoncia', bio: 'Atención en San Luis; turnos, obras sociales.',
  foto_url: null, plan: 'basico', auto_edicion_habilitada: false, user_id: null,
  activo: true, created_at: '', updated_at: '',
}
const mk = (tipo: string, label: string, valor: string, orden: number): Link =>
  ({ id: 'l'+orden, profile_id: 'p1', tipo: tipo as Link['tipo'], label, valor, orden, activo: true, created_at: '' })

const links: Link[] = [
  mk('whatsapp','WhatsApp','2664123456',1),
  mk('telefono','Teléfono','02664123456',2),
  mk('agenda','Turnos','https://calendly.com/lucia',3),
  mk('instagram','Instagram','dra.luciafernandez',4),
  mk('ubicacion','Consultorio','Av. Illia 350, San Luis, Argentina',5),
  mk('alias_cbu','Alias','lucia.odonto.sl',6),
  mk('email','Mail','contacto@ejemplo.com.ar',7),
  mk('web','Web','ejemplo-odontologia.com.ar',8),
]

console.log('--- HREFS ---')
for (const l of links) console.log(l.tipo.padEnd(10), '->', hrefDeLink(l))

const vcf = generarVCard(profile, links, { urlPerfil: 'https://takemycard.vercel.app/dra-lucia-fernandez' })
console.log('\n--- VCF (CRLF shown as \\r\\n) ---')
console.log(JSON.stringify(vcf).replace(/\\r\\n/g, '\\r\\n\n'))
// Desplegar (unfold) para poder verificar contenido partido en varias lineas.
const plano = vcf.replace(/\r\n /g, '')
console.log('\n--- checks ---')
const asserts: [string, boolean][] = [
  ['empieza BEGIN:VCARD', vcf.startsWith('BEGIN:VCARD\r\n')],
  ['termina END:VCARD', vcf.endsWith('END:VCARD\r\n')],
  ['usa CRLF', !/[^\r]\n/.test(vcf)],
  ['un solo TEL (dedup wa/tel)', (vcf.match(/\r\nTEL/g) || []).length === 1],
  ['TEL en E.164 +549266...', vcf.includes('TEL;TYPE=CELL,VOICE:+5492664123456')],
  ['EMAIL presente', vcf.includes('EMAIL;TYPE=INTERNET:contacto@ejemplo.com.ar')],
  ['N apellido/nombre sin título', vcf.includes('N:Fernández;Lucía;;;')],
  ['ADR presente', vcf.includes('ADR;TYPE=WORK:')],
  ['unfold reconstruye la URL de maps', plano.includes('query=Av.%20Illia%20350%2C%20San%20Luis%2C%20Argentina')],
  ['alias en el NOTE unico', plano.includes('Alias: lucia.odonto.sl')],
  ['un solo NOTE', (vcf.match(/\r\nNOTE:/g) || []).length === 1],
  ['params TYPE solo ASCII', vcf.split('\r\n').filter(l=>l.startsWith('URL;')).every(l => /^URL;TYPE=[A-Za-z0-9-]+:/.test(l))],
  ['punto y coma escapado en bio', vcf.includes('turnos\\, obras sociales')],
  ['sin línea > 75 bytes', vcf.split('\r\n').every(l => Buffer.byteLength(l,'utf8') <= 76)],
]
let fallos = 0
for (const [n, ok] of asserts) { if(!ok) fallos++; console.log(ok ? 'OK  ' : 'FAIL', n) }
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLOS`)
process.exit(fallos ? 1 : 0)
