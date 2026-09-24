/**
 * Pruebas del límite de tamaño del beacon público de analítica.
 *
 * No consulta Supabase: verifica que la ruta descarte cargas inválidas antes
 * de intentar registrar un evento.
 *
 *   npm run test:evento
 */
import { POST } from '@/app/api/evento/route'

const casos: [string, Request][] = [
  [
    'descarta un Content-Length mayor al permitido',
    new Request('https://take-my-card.test/api/evento', {
      method: 'POST',
      headers: { 'content-length': '4097' },
      body: '{}',
    }),
  ],
  [
    'descarta un cuerpo grande aunque no declare Content-Length',
    new Request('https://take-my-card.test/api/evento', {
      method: 'POST',
      body: JSON.stringify({ relleno: 'x'.repeat(4096) }),
    }),
  ],
  [
    'descarta JSON malformado sin exponer detalles',
    new Request('https://take-my-card.test/api/evento', { method: 'POST', body: '{' }),
  ],
]

let fallos = 0
for (const [nombre, request] of casos) {
  const respuesta = await POST(request)
  const ok = respuesta.status === 204 && respuesta.headers.get('cache-control') === 'no-store'
  if (!ok) fallos++
  console.log(ok ? 'OK  ' : 'FAIL', nombre)
}

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLOS`)
process.exit(fallos ? 1 : 0)
