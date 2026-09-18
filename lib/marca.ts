/**
 * Datos de marca y de negocio en un solo lugar.
 *
 * Todo lo que se cambia seguido --el número de WhatsApp, los textos de venta,
 * qué incluye cada plan-- vive acá y no desparramado por los componentes. Si
 * hay que corregir algo del sitio comercial, este es el único archivo que hace
 * falta tocar.
 */

export const MARCA = {
  nombre: 'TakeMyCard',
  eslogan: 'La revolución de las tarjetas personales',
  ciudad: 'San Luis',
  provincia: 'San Luis, Argentina',
} as const

/**
 * WhatsApp de contacto, en formato internacional y sin signos: país + área sin
 * el 0 + 9 + número sin el 15. Para San Luis (área 266) un celular queda
 * 549266XXXXXXX.
 *
 * Se lee de una variable de entorno para poder cambiarlo desde Vercel sin
 * tocar el código, pero tiene un valor por defecto para que el sitio funcione
 * en local sin configurar nada.
 */
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '5492664000000'

/** ¿Está puesto un número de verdad, o seguimos con el de ejemplo? */
export const WHATSAPP_CONFIGURADO = WHATSAPP !== '5492664000000'

/**
 * Arma el link de WhatsApp con un mensaje ya escrito. Que el visitante no
 * tenga que redactar nada baja muchísimo la fricción para escribir.
 */
export function linkWhatsapp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

/** Slug del perfil de demostración (el del seed). Se muestra como ejemplo vivo. */
export const SLUG_DEMO = 'dra-lucia-fernandez'

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

export type Plan = {
  id: 'basico' | 'plus' | 'premium'
  nombre: string
  /** Bajada corta: para quién es este plan. */
  para: string
  /** Lo que incluye, en orden de importancia para el que compra. */
  incluye: string[]
  /**
   * Lo que NO incluye. Se muestra tachado a propósito: la comparación honesta
   * de lo que falta es lo que hace que el plan de arriba se vea conveniente.
   */
  noIncluye: string[]
  /** Destaca visualmente la columna (el plan que queremos que elijan). */
  destacado?: boolean
  /** Texto del botón de esa columna. */
  cta: string
}

/**
 * Los tres planes, en orden de precio.
 *
 * El "plus" está construido como subconjunto estricto del premium: no tiene
 * ninguna función que el premium no tenga. Es deliberado --es el plan señuelo
 * del que habla el plan de negocio-- y por eso su columna de "no incluye" es
 * la más larga de las tres.
 */
export const PLANES: Plan[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    para: 'Para empezar a repartir tarjetas ya, sin vueltas.',
    incluye: [
      'Tarjeta física con chip NFC',
      'Tu página propia en takemycard.com/tu-nombre',
      'Foto o logo, nombre, profesión y presentación',
      'Botones de WhatsApp, redes, web, agenda, ubicación y alias/CBU',
      'Botón «Guardar contacto»: entra a la agenda del otro de una',
      'Actualizamos tus datos cuando lo pidas',
    ],
    noIncluye: [
      'Diseño propio: usa nuestra plantilla',
      'Panel para editarte vos mismo',
      'Estadísticas de uso',
    ],
    cta: 'Quiero el Básico',
  },
  {
    id: 'plus',
    nombre: 'Plus',
    para: 'Para quien quiere manejar su página sin depender de nadie.',
    incluye: [
      'Todo lo del Básico',
      'Colores y tipografía adaptados a tu marca',
      'Panel propio: editás tus datos vos, cuando quieras',
      'Cuántas veces abrieron tu tarjeta',
    ],
    noIncluye: [
      'Qué botón tocó cada visitante',
      'Portfolio, testimonios y formulario de contacto',
      'Landing diseñada a medida',
      'Cambios ilimitados',
    ],
    cta: 'Quiero el Plus',
  },
  {
    id: 'premium',
    nombre: 'Premium',
    para: 'Para el profesional que vive de su marca personal.',
    incluye: [
      'Todo lo del Plus',
      'Landing 100% a medida, diseñada con ayuda de IA',
      'Portfolio, testimonios y formulario de contacto',
      'Estadísticas completas: qué botón tocan, cuál funciona mejor y cómo evoluciona mes a mes',
      'Cambios ilimitados mientras dure la suscripción',
    ],
    noIncluye: [],
    destacado: true,
    cta: 'Quiero el Premium',
  },
]

/** Los tres pasos del proceso, para la sección «cómo funciona». */
export const PASOS = [
  {
    titulo: 'Nos contás quién sos',
    texto:
      'Tus datos, tus redes, tu foto. Por WhatsApp, en cinco minutos. No hay formularios eternos ni hace falta que sepas nada de tecnología.',
  },
  {
    titulo: 'Armamos tu página y tu tarjeta',
    texto:
      'Te mostramos la página antes de imprimir nada. Cuando le das el visto bueno, grabamos el chip y te entregamos la tarjeta en mano.',
  },
  {
    titulo: 'La acercás a un celular',
    texto:
      'El teléfono del otro abre tu página sola. Sin apps, sin escanear nada, sin que nadie tipee tu nombre mal. Y te guardan el contacto con un toque.',
  },
] as const

/** Preguntas que aparecen siempre en la primera conversación con un cliente. */
export const PREGUNTAS = [
  {
    p: '¿Hace falta que el otro tenga una app?',
    r: 'No. El NFC ya viene en los celulares desde hace años y funciona con la pantalla encendida, sin instalar nada. Si un teléfono muy viejo no lo tuviera, la tarjeta igual lleva tu dirección escrita para que la puedan abrir a mano.',
  },
  {
    p: '¿Y si cambio de teléfono, de trabajo o de redes?',
    r: 'No pasa nada: la tarjeta no guarda tus datos, guarda la dirección de tu página. Cambiás lo que quieras en la página y todas las tarjetas que ya repartiste quedan actualizadas solas.',
  },
  {
    p: '¿Cuánto dura la tarjeta?',
    r: 'El chip no tiene batería ni se gasta con el uso. Es plástico: te va a durar lo que dura una tarjeta de crédito en tu billetera.',
  },
  {
    p: '¿Puedo tener más de una tarjeta?',
    r: 'Sí, y conviene. Todas apuntan a la misma página, así que podés tener una en la billetera, otra en el mostrador y otra pegada atrás del celular.',
  },
  {
    p: '¿Funciona en iPhone?',
    r: 'Sí, desde el iPhone 7 en adelante, sin configurar nada. En Android también, en prácticamente cualquier equipo de los últimos años.',
  },
] as const
