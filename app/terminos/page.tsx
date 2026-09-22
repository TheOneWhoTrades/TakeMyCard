import Link from 'next/link'
import { DatoLegal, Documento } from '@/components/legal/Documento'
import { LEGAL, MARCA, PLANES } from '@/lib/marca'

export const metadata = {
  title: 'Términos y condiciones',
  description: `Condiciones de contratación y uso del servicio de ${MARCA.nombre}.`,
  alternates: { canonical: '/terminos' },
}

export default function PaginaTerminos() {
  return (
    <Documento
      titulo="Términos y condiciones"
      bajada={`Las reglas del servicio: qué contratás, qué te damos, qué pasa si dejás de pagar y qué no podés publicar.`}
    >
      <h2>1. Quiénes somos y qué alcanza este documento</h2>
      <p>
        Estos términos regulan la contratación y el uso de los servicios de{' '}
        {MARCA.nombre}, prestados por{' '}
        <DatoLegal valor={LEGAL.titular} que="el titular o razón social" />, CUIT{' '}
        <DatoLegal valor={LEGAL.cuit} que="el CUIT" />, con domicilio en{' '}
        <DatoLegal valor={LEGAL.domicilio} que="el domicilio" />, {MARCA.provincia}.
      </p>
      <p>
        Al contratar cualquiera de los planes o al usar el sitio, aceptás estas
        condiciones. Si no estás de acuerdo con alguna, no contrates el servicio.
      </p>

      <h2>2. Qué es el servicio</h2>
      <p>
        {MARCA.nombre} entrega tarjetas personales con chip NFC y publica, en una
        dirección web propia, un perfil digital del cliente con sus datos de contacto,
        links y agenda. Al acercar la tarjeta a un teléfono, éste abre ese perfil.
      </p>
      <p>
        Cada plan incluye <strong>dos tarjetas físicas</strong>. Las tarjetas de repuesto
        se venden por separado, al precio vigente al momento del pedido.
      </p>

      <h2>3. Planes y precios</h2>
      <table className="tabla-legal">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Precio</th>
            <th>Forma de pago</th>
          </tr>
        </thead>
        <tbody>
          {PLANES.map((plan) => (
            <tr key={plan.id}>
              <td>{plan.nombre}</td>
              <td>{plan.precio.principal}</td>
              <td>{plan.precio.detalle}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Los precios están expresados en dólares estadounidenses. El pago se realiza en
        pesos argentinos, salvo acuerdo distinto, al tipo de cambio vigente el día de la
        facturación. Los precios pueden actualizarse; a los clientes con plan mensual
        vigente se les avisa con al menos 30 días de anticipación, y pueden dar de baja
        antes de que el nuevo precio entre en vigencia.
      </p>
      <p>
        Las diferencias de funciones entre planes están detalladas en la{' '}
        <Link href="/#planes">página de planes</Link> y forman parte de estos términos.
      </p>

      <h2>4. Qué pasa si se interrumpe el pago</h2>
      <p>Esto importa y conviene que esté claro antes y no después:</p>
      <ul>
        <li>
          En los planes con abono mensual (Plus y Premium), si un pago no se acredita
          dentro de los <strong>10 días corridos</strong> del vencimiento, te avisamos por
          el canal de contacto que tengamos.
        </li>
        <li>
          Pasados <strong>30 días corridos</strong> de impago, el perfil se{' '}
          <strong>pausa</strong>: la dirección web sigue existiendo, pero muestra un aviso
          de que la tarjeta está pausada en lugar de tus datos. La tarjeta física no se
          rompe ni se desactiva.
        </li>
        <li>
          El contenido se conserva. Cuando se regulariza el pago, el perfil se reactiva
          con todo como estaba, incluidas las estadísticas.
        </li>
        <li>
          Pasados <strong>12 meses</strong> de baja, los datos se eliminan
          definitivamente, según lo indicado en la{' '}
          <Link href="/privacidad">política de privacidad</Link>.
        </li>
      </ul>
      <p>
        El pago único inicial no se reintegra por baja posterior: cubre el diseño del
        perfil y la fabricación de las tarjetas físicas, que ya fueron entregadas.
      </p>

      <h2>5. Tus obligaciones como cliente</h2>
      <ul>
        <li>
          Los datos que cargás tienen que ser <strong>veraces</strong> y tenés que tener
          derecho a publicarlos. Sos responsable del contenido de tu perfil.
        </li>
        <li>
          No podés publicar contenido ilegal, que infrinja derechos de terceros (marcas,
          fotos ajenas, propiedad intelectual), engañoso sobre tu profesión o matrícula,
          ni datos personales de otras personas sin su consentimiento.
        </li>
        <li>
          Si tu actividad requiere matrícula o habilitación, sos vos quien responde por
          tenerla y por informarla correctamente.
        </li>
        <li>
          Cuidá tu acceso al panel: lo que se hace desde tu sesión se considera hecho por
          vos. Avisanos si creés que alguien más accedió.
        </li>
        <li>
          No podés usar el servicio para enviar spam, para suplantar a otra persona ni
          para redirigir a sitios con software malicioso.
        </li>
      </ul>
      <p>
        Si detectamos un incumplimiento grave, podemos pausar el perfil. Salvo que la
        gravedad o una orden judicial exijan actuar de inmediato, primero te avisamos y te
        damos un plazo razonable para corregirlo.
      </p>

      <h2>6. La dirección de tu perfil y el código de la tarjeta</h2>
      <p>
        Tu perfil vive en una dirección del tipo <code>/tu-nombre</code>. La tarjeta
        física <strong>no</strong> lleva grabada esa dirección: lleva un código corto que
        redirige a ella. Gracias a eso podemos cambiar el dominio o la estructura de las
        direcciones sin que las tarjetas ya entregadas dejen de funcionar.
      </p>
      <p>
        La dirección del perfil se asigna al contratar y sólo la modificamos nosotros, a
        pedido tuyo y con la advertencia correspondiente. No otorga derecho de marca ni
        propiedad sobre el nombre elegido.
      </p>

      <h2>7. Disponibilidad</h2>
      <p>
        Hacemos lo razonable para que el servicio esté disponible de forma continua, pero
        no garantizamos una disponibilidad del 100%: depende de proveedores de hosting y
        de conectividad que no controlamos. Las interrupciones programadas por
        mantenimiento se avisan cuando es posible.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        El contenido que cargás (textos, fotos, logos) sigue siendo tuyo. Nos otorgás una
        licencia limitada, no exclusiva y gratuita para alojarlo, mostrarlo y adaptarlo
        técnicamente (redimensionar imágenes, generar el archivo de contacto) con el único
        fin de prestarte el servicio. Esa licencia termina cuando se eliminan tus datos.
      </p>
      <p>
        El diseño del sitio, el software, la marca {MARCA.nombre} y las plantillas de
        perfil son nuestros y no se transfieren con la contratación.
      </p>
      <p>
        Podemos mostrar tu perfil como ejemplo comercial sólo si nos lo autorizás
        expresamente.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        {MARCA.nombre} no es responsable del contenido publicado por los clientes ni de
        las relaciones comerciales que surjan a partir del intercambio de una tarjeta.
        Tampoco responde por daños indirectos o lucro cesante. En cualquier caso, nuestra
        responsabilidad total está limitada al monto que hayas abonado por el servicio en
        los últimos doce meses.
      </p>
      <p>
        Nada de lo anterior limita los derechos que te correspondan como consumidor por la
        Ley 24.240 de Defensa del Consumidor, que son irrenunciables.
      </p>

      <h2>10. Derecho de arrepentimiento</h2>
      <p>
        Si contratás a distancia (por WhatsApp, por ejemplo) y sos consumidor final,
        tenés <strong>10 días corridos</strong> desde la contratación o desde la entrega de
        las tarjetas —lo que ocurra último— para arrepentirte sin expresar causa y sin
        costo, conforme al art. 34 de la Ley 24.240. Para ejercerlo, escribinos a{' '}
        <DatoLegal valor={LEGAL.emailPrivacidad} que="el email de contacto" />. Las
        tarjetas físicas deben devolverse en el estado en que se recibieron.
      </p>

      <h2>11. Baja del servicio</h2>
      <p>
        Podés dar de baja cuando quieras, escribiéndonos por el mismo canal por el que
        contrataste. La baja se hace efectiva al finalizar el período ya abonado. No hace
        falta que expliques por qué, y el trámite no puede ser más difícil que el de alta.
      </p>

      <h2>12. Cambios en estos términos</h2>
      <p>
        Podemos modificar estos términos. Si el cambio afecta condiciones esenciales
        (precio, alcance del servicio), lo avisamos con 30 días de anticipación a los
        clientes vigentes, que podrán dar de baja sin penalidad si no lo aceptan.
      </p>

      <h2>13. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Para cualquier
        controversia serán competentes {LEGAL.jurisdiccion}, sin perjuicio del derecho del
        consumidor a demandar ante el juez de su domicilio.
      </p>

      <p>
        Ver también: <Link href="/privacidad">política de privacidad</Link> y{' '}
        <Link href="/cookies">política de cookies</Link>.
      </p>
    </Documento>
  )
}
