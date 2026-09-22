import Link from 'next/link'
import { Documento, EmailContacto } from '@/components/legal/Documento'
import { MARCA } from '@/lib/marca'

export const metadata = {
  title: 'Política de cookies',
  description: `Qué cookies usa ${MARCA.nombre} y por qué no hace falta un cartel de consentimiento.`,
  alternates: { canonical: '/cookies' },
}

export default function PaginaCookies() {
  return (
    <Documento
      titulo="Política de cookies"
      bajada="Qué cookies usa el sitio, para qué, y por qué no vas a encontrar un cartel pidiéndote permiso."
    >
      <h2>La respuesta corta</h2>
      <p>
        En las páginas públicas de {MARCA.nombre} —la home, las tarjetas digitales de los
        profesionales y estos documentos— <strong>no hay ninguna cookie</strong>. Ni
        nuestras ni de terceros. Tampoco usamos almacenamiento local, píxeles de
        seguimiento, identificadores de dispositivo ni huella digital del navegador.
      </p>
      <p>
        Las únicas cookies del sitio son las que mantienen abierta la sesión de quien
        inicia sesión en el panel: los administradores y los clientes de los planes Plus y
        Premium. Si nunca iniciaste sesión, tu navegador no guarda nada nuestro.
      </p>

      <h2>Por qué no hay cartel de consentimiento</h2>
      <p>
        Porque no corresponde. El consentimiento previo se exige para las cookies que no
        son imprescindibles: las de analítica, publicidad o personalización. Las cookies
        estrictamente necesarias para prestar un servicio que el usuario pidió
        expresamente —como mantener abierta una sesión que él mismo inició— están
        exceptuadas tanto en el criterio europeo (Directiva 2002/58/CE, art. 5.3, y las
        guías del Comité Europeo de Protección de Datos) como en la práctica argentina
        bajo la Ley 25.326.
      </p>
      <p>
        Y la analítica, que es lo que normalmente obliga a poner el cartel, acá está
        resuelta sin cookies: el conteo de visitas y clics de una tarjeta no usa ningún
        identificador, así que no hay nada que consentir. Fue una decisión de diseño del
        producto, no una omisión: se explica en la{' '}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
      <p>
        Dicho de otro modo: un cartel de cookies que no tiene nada que pedirte es ruido y
        acostumbra a la gente a aceptar sin leer. Preferimos no tener qué pedirte.
      </p>

      <h2>El detalle: qué se guarda y cuándo</h2>
      <table className="tabla-legal">
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Cuándo aparece</th>
            <th>Para qué</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-&lt;proyecto&gt;-auth-token</code>
            </td>
            <td>Sólo al iniciar sesión en /admin o /panel</td>
            <td>
              Mantener la sesión abierta para no pedir la clave en cada página. Es
              estrictamente necesaria: sin ella no hay panel.
            </td>
            <td>Hasta cerrar sesión (se renueva mientras se usa)</td>
          </tr>
        </tbody>
      </table>
      <p>
        La emite nuestro proveedor de autenticación (Supabase) en nuestro propio dominio.
        No se comparte con terceros, no sirve para seguirte por otros sitios y se borra al
        cerrar sesión.
      </p>

      <h2>Lo que este sitio no tiene</h2>
      <ul>
        <li>Google Analytics ni ninguna otra herramienta de analítica de terceros.</li>
        <li>Píxel de Meta, de TikTok ni de ninguna red publicitaria.</li>
        <li>Botones de redes sociales que carguen scripts ajenos.</li>
        <li>
          Pedidos a Google Fonts: las tipografías se sirven desde nuestro propio dominio.
        </li>
        <li>Mapas, videos o widgets embebidos que instalen cookies de terceros.</li>
      </ul>
      <p>
        Si en el futuro incorporamos alguna de estas cosas, esta página se actualiza
        <em> antes</em> y, si hiciera falta consentimiento, aparecerá el pedido
        correspondiente.
      </p>

      <h2>Cómo controlarlas igual</h2>
      <p>
        Todos los navegadores permiten ver, bloquear y borrar cookies desde su
        configuración de privacidad. Si bloqueás las de este sitio, todo va a seguir
        funcionando salvo el inicio de sesión en el panel, que deja de ser posible.
      </p>

      <h2>Consultas</h2>
      <p>
        Cualquier duda sobre esta política:{' '}
        <EmailContacto asunto="Consulta sobre cookies" />.
      </p>
    </Documento>
  )
}
