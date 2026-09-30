/**
 * Pruebas de destinoSeguro: cada caso de abajo es una forma conocida de sacar a
 * alguien de nuestro sitio después de ingresar. Si alguno pasa, el login se
 * vuelve un trampolín de phishing.
 */
import { destinoSeguro } from '@/lib/destino'

const DEF = '/panel'

const casos: [string, boolean][] = [
  // Lo que tiene que funcionar.
  ['ruta interna simple', destinoSeguro('/panel', DEF) === '/panel'],
  ['ruta interna con query', destinoSeguro('/panel/estadisticas?dias=30', DEF) === '/panel/estadisticas?dias=30'],
  ['admin', destinoSeguro('/admin', '/admin') === '/admin'],
  ['vacío usa el defecto', destinoSeguro('', DEF) === DEF],
  ['null usa el defecto', destinoSeguro(null, DEF) === DEF],
  ['undefined usa el defecto', destinoSeguro(undefined, DEF) === DEF],

  // Lo que nunca tiene que salir de nuestro origen.
  ['URL absoluta', destinoSeguro('https://sitio-falso.com', DEF) === DEF],
  ['protocolo relativo //', destinoSeguro('//sitio-falso.com', DEF) === DEF],
  ['barra invertida /\\', destinoSeguro('/\\sitio-falso.com', DEF) === DEF],
  ['tabulación entre barras', destinoSeguro('/\t/sitio-falso.com', DEF) === DEF],
  ['salto de línea entre barras', destinoSeguro('/\n/sitio-falso.com', DEF) === DEF],
  ['retorno de carro entre barras', destinoSeguro('/\r/sitio-falso.com', DEF) === DEF],
  ['javascript:', destinoSeguro('javascript:alert(1)', DEF) === DEF],
  ['ruta sin barra inicial', destinoSeguro('sitio-falso.com', DEF) === DEF],
  ['tres barras', destinoSeguro('///sitio-falso.com', DEF) === DEF],
  ['barra y barra invertida', destinoSeguro('/\\/sitio-falso.com', DEF) === DEF],
]

let fallas = 0
for (const [nombre, ok] of casos) {
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}`)
  if (!ok) fallas++
}

if (fallas) {
  console.error(`\n${fallas} caso(s) fallaron`)
  process.exit(1)
}
console.log('\nTODO OK')
