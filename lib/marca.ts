/**
 * Marca, negocio y datos legales en un solo lugar.
 *
 * El brief lo pide explícitamente: el nombre todavía está en revisión, así que
 * todo lo visible --logo, textos, metadatos, emails, páginas legales-- tiene
 * que salir de una única constante. Si el proyecto pasa a llamarse de otra
 * manera, se cambia acá y no queda ningún «TakeMyCard» suelto en el código.
 */

export const MARCA = {
  nombre: 'TakeMyCard',
  eslogan: 'La revolución de las tarjetas personales',
  ciudad: 'San Luis',
  provincia: 'San Luis, Argentina',
  pais: 'Argentina',
  /**
   * Dominio de la marca, sólo para mostrar en textos de venta ("tudominio/tu-nombre").
   * Las URLs reales se arman con siteUrl() de lib/env.ts, que en producción sale
   * de la variable de entorno: todavía no hay dominio comprado.
   */
  dominioVisible: 'takemycard.com.ar',
} as const

// ---------------------------------------------------------------------------
// Datos legales
// ---------------------------------------------------------------------------

/**
 * Identidad del responsable del tratamiento de datos.
 *
 * Las páginas de privacidad, términos y cookies leen de acá. Mientras el
 * proyecto esté en prueba piloto, los tres datos de identificación pueden
 * quedar en null: ver MODO_PILOTO, abajo.
 */
export const LEGAL = {
  /** Nombre y apellido o razón social de quien responde por los datos. */
  titular: null as string | null,
  /** CUIT / CUIL del titular. */
  cuit: null as string | null,
  /** Domicilio legal, para notificaciones y para la AAIP. */
  domicilio: null as string | null,
  /**
   * Email al que se ejercen los derechos de acceso, rectificación y supresión,
   * y canal de contacto de las páginas legales. Es una casilla del proyecto a
   * la que acceden los dos socios: no una personal, que además de exponer a una
   * sola persona dejaría el trámite colgado si esa persona no está.
   */
  emailPrivacidad: 'proyectotarjetanfc@gmail.com' as string | null,
  /** Desde cuándo rige esta versión de los textos legales. */
  vigenteDesde: '2026-09-22',
  /** Jurisdicción para los términos. */
  jurisdiccion: 'los tribunales ordinarios de la Ciudad de San Luis, Provincia de San Luis',
} as const

/**
 * Modo piloto: el proyecto todavía no comercializa el servicio.
 *
 * Durante el piloto (un solo cliente, sin cargo) no hace falta publicar razón
 * social, CUIT ni domicilio: no hay contrato de consumo ni cobro, y el único
 * titular de datos involucrado sabe perfectamente quién está del otro lado. Lo
 * que sí hace falta es un canal de contacto real, que es `emailPrivacidad`.
 *
 * En este modo las páginas legales lo dicen con todas las letras en vez de
 * mostrar huecos: es información verdadera sobre la etapa del proyecto, no una
 * excusa. Nada se disfraza de definitivo.
 *
 * AL LANZAR COMERCIALMENTE: completar los tres datos de arriba y poner esto en
 * `false`. Si queda en `false` con datos faltantes, las páginas vuelven a
 * mostrar el aviso rojo de borrador — que es exactamente la red de seguridad
 * que queremos, porque publicar precios al público sin identificar al oferente
 * sí es un problema.
 */
export const MODO_PILOTO = true

export type EstadoLegal = 'completo' | 'piloto' | 'incompleto'

/**
 * En qué estado están los textos legales, que es lo que decide qué versión de
 * la identificación se publica y qué aviso se muestra.
 *
 * `completo` gana siempre: una vez cargados los datos, el modo piloto deja de
 * tener efecto solo y no hay que acordarse de apagarlo.
 */
export function estadoLegal(): EstadoLegal {
  if (LEGAL.titular && LEGAL.cuit && LEGAL.domicilio && LEGAL.emailPrivacidad) return 'completo'
  return MODO_PILOTO ? 'piloto' : 'incompleto'
}

/** Atajo para los textos: ¿estamos mostrando la versión de etapa piloto? */
export function esPiloto(): boolean {
  return estadoLegal() === 'piloto'
}

/** `mailto:` al canal de contacto, con asunto si conviene. */
export function linkEmail(asunto?: string): string {
  const destino = LEGAL.emailPrivacidad ?? ''
  return asunto ? `mailto:${destino}?subject=${encodeURIComponent(asunto)}` : `mailto:${destino}`
}

// ---------------------------------------------------------------------------
// Contacto
// ---------------------------------------------------------------------------

/**
 * WhatsApp de contacto, en formato internacional y sin signos: 54 + 9 +
 * característica sin el 0 + número sin el 15. Para San Luis (característica
 * 266) queda 549266XXXXXXX.
 *
 * Se puede pisar con la variable de entorno NEXT_PUBLIC_WHATSAPP desde Vercel,
 * para cambiar el número sin tocar el código ni volver a publicar el repo.
 */
// `|| ` y no `?? `: si la variable existe pero está vacía --que es como queda
// al copiar .env.example sin completarla-- hay que caer igual al número de
// acá. Con `??` el sitio armaría links a wa.me/ sin destino.
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP?.trim() || '5492664201239'

/**
 * Los mensajes que el visitante encuentra ya escritos al abrir WhatsApp.
 *
 * Que no tenga que redactar nada baja muchísimo la fricción para escribir, y
 * que el texto diga de dónde salió el clic sirve del otro lado: se sabe si la
 * persona venía mirando un plan concreto antes de contestarle.
 */
export const MENSAJES = {
  /** Portada y cierre: el interesado genérico. */
  general: 'Hola! Estoy interesado en crear mi tarjeta digital. ¿Me contás cómo es?',

  /** Botón de una columna de planes. */
  plan: (plan: string) =>
    `Hola! Estoy interesado en crear mi tarjeta digital con el plan ${plan}. ¿Me contás cómo es?`,

  /**
   * Formulario de contacto de la home. No se guarda nada de lo que la persona
   * escribe: el formulario arma este texto y abre WhatsApp, donde la
   * conversación sigue. Es la decisión de producto que hace que el sitio
   * comercial no procese ningún dato personal.
   */
  consulta: ({ nombre, actividad, mensaje }: { nombre: string; actividad: string; mensaje: string }) =>
    [
      `Hola! Soy ${nombre || 'un interesado'}.`,
      actividad && `Me dedico a: ${actividad}.`,
      mensaje && mensaje,
      'Quiero saber más sobre las tarjetas digitales.',
    ]
      .filter(Boolean)
      .join('\n'),

  /**
   * Distinto a propósito: quien escribe desde acá no es un interesado, es
   * alguien que tiene una tarjeta en la mano y no le funciona.
   */
  tarjetaRota: (slug: string) =>
    `Hola! Acerqué una tarjeta de ${MARCA.nombre} a la dirección /${slug} y no me funciona.`,

  /** Igual que el anterior, pero cuando lo que falló fue el código del chip. */
  codigoRoto: (codigo: string) =>
    `Hola! Acerqué una tarjeta de ${MARCA.nombre} con el código ${codigo} y no me funciona.`,
} as const

/** Arma el link de WhatsApp con el mensaje ya cargado. */
export function linkWhatsapp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

/** Slug del perfil de demostración (el del seed). Se muestra como ejemplo vivo. */
export const SLUG_DEMO = 'estudio-demo'

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

/**
 * Los tres planes, tal como quedaron definidos en el brief.
 *
 * Los tres salen al mercado juntos y los tres incluyen dos tarjetas físicas;
 * las de repuesto se venden aparte.
 *
 * El corte principal está entre Básico y Plus: en el Básico el perfil lo
 * cargamos y lo editamos nosotros, el cliente no entra al panel.
 */

export type PlanComercial = {
  id: 'basico' | 'plus' | 'premium'
  nombre: string
  /** Bajada corta: para quién es este plan. */
  para: string
  precio: {
    /** Línea principal del precio. */
    principal: string
    /** Aclaración debajo (forma de pago o recurrencia). */
    detalle: string
  }
  /** Destaca visualmente la columna (el plan que queremos que elijan). */
  destacado?: boolean
}

/**
 * Los dos llamados a la acción del sitio, y la diferencia entre ellos importa.
 *
 * El de la portada habla con alguien que todavía no sabe qué está mirando: le
 * ofrece una conversación, no una compra. El de las columnas de planes habla
 * con alguien que ya leyó los precios y eligió: ahí pedir «presupuesto» sería
 * poner un trámite en el medio de una decisión ya tomada.
 *
 * Los tres botones de plan dicen lo mismo a propósito; lo que cambia es el
 * mensaje de WhatsApp que llevan, que sí nombra el plan.
 */
export const CTA_ASESOR = 'Hablar con un asesor'
export const CTA_PLAN = 'Quiero mi tarjeta'

export const PLANES: PlanComercial[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    para: 'Para empezar a repartir tarjetas ya. Tu página la cargamos y la mantenemos nosotros.',
    precio: { principal: 'USD 50 / año', detalle: 'Pago único o en cuotas' },
  },
  {
    id: 'plus',
    nombre: 'Plus',
    para: 'Para quien quiere manejar su página solo, cuando quiera y sin pedirle permiso a nadie.',
    precio: { principal: 'USD 45 + USD 8 / mes', detalle: 'USD 45 de entrada, una sola vez' },
  },
  {
    id: 'premium',
    nombre: 'Premium',
    para: 'Para el profesional que vive de su marca personal y quiere saber qué pasa con su tarjeta.',
    precio: { principal: 'USD 50 + USD 10 / mes', detalle: 'USD 50 de entrada, una sola vez' },
    destacado: true,
  },
]

/**
 * La tabla comparativa del brief, fila por fila.
 *
 * Se modela como tabla y no como tres listas de «incluye / no incluye» porque
 * es como está decidido y porque el que compara planes quiere leer en
 * horizontal: qué cambia de una columna a la otra.
 */
export type FilaComparativa = {
  funcion: string
  /** Texto por plan. `true` = «Sí», `false` = «No», string = texto propio. */
  basico: boolean | string
  plus: boolean | string
  premium: boolean | string
  /** Aclaración opcional debajo del nombre de la función. */
  nota?: string
}

export const COMPARATIVA: FilaComparativa[] = [
  {
    funcion: 'Tarjetas físicas incluidas',
    basico: '2',
    plus: '2',
    premium: '2',
    nota: 'Las de repuesto se venden aparte.',
  },
  { funcion: 'Perfil digital con contacto y links', basico: true, plus: true, premium: true },
  {
    funcion: 'Botón «Guardar contacto»',
    basico: true,
    plus: true,
    premium: true,
    nota: 'El visitante te guarda en su agenda de un toque.',
  },
  {
    funcion: 'Color de la tarjeta digital',
    basico: '6 colores a elegir',
    plus: true,
    premium: true,
  },
  { funcion: 'Foto de perfil', basico: true, plus: true, premium: true },
  { funcion: 'Foto de portada', basico: false, plus: true, premium: true },
  {
    funcion: 'Panel de autoedición',
    basico: false,
    plus: true,
    premium: true,
    nota: 'En el Básico los cambios los hacemos nosotros cuando los pedís.',
  },
  {
    funcion: 'Seguimiento de datos',
    basico: false,
    plus: false,
    premium: true,
    nota: 'Cuántas veces abrieron tu tarjeta y qué botón tocaron.',
  },
  {
    funcion: 'Landing personalizada',
    basico: false,
    plus: false,
    premium: true,
    nota: 'Mismo contenido, diseño propio.',
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
      'Te mostramos la página antes de imprimir nada. Cuando le das el visto bueno, grabamos el chip y te entregamos las dos tarjetas en mano.',
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
    r: 'No pasa nada: la tarjeta no guarda tus datos, guarda un código que apunta a tu página. Cambiás lo que quieras en la página y todas las tarjetas que ya repartiste quedan actualizadas solas. Incluso si el día de mañana cambiamos de dominio.',
  },
  {
    p: '¿Cuánto dura la tarjeta?',
    r: 'El chip no tiene batería ni se gasta con el uso. Es plástico: te va a durar lo que dura una tarjeta de crédito en tu billetera.',
  },
  {
    p: '¿Puedo tener más de una tarjeta?',
    r: 'Sí, y conviene. Cada plan incluye dos, y podés comprar más. Todas apuntan a la misma página, así que podés tener una en la billetera, otra en el mostrador y otra pegada atrás del celular.',
  },
  {
    p: '¿Funciona en iPhone?',
    r: 'Sí, desde el iPhone 7 en adelante, sin configurar nada. En Android también, en prácticamente cualquier equipo de los últimos años.',
  },
  {
    p: '¿Guardan datos de la gente que abre mi tarjeta?',
    r: 'No. No usamos cookies ni guardamos la IP, el teléfono ni ningún dato de quien abre tu página: sólo contamos cuántas veces se abrió y qué botón se tocó, sin poder saber quién fue. Está explicado en detalle en la política de privacidad.',
  },
] as const
