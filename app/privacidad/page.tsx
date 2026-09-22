import Link from 'next/link'
import { DatoLegal, Documento } from '@/components/legal/Documento'
import { LEGAL, MARCA } from '@/lib/marca'

export const metadata = {
  title: 'Política de privacidad',
  description: `Qué datos trata ${MARCA.nombre}, para qué, con quién los comparte y cómo ejercer tus derechos.`,
  alternates: { canonical: '/privacidad' },
}

export default function PaginaPrivacidad() {
  return (
    <Documento
      titulo="Política de privacidad"
      bajada={
        `Qué datos tratamos, para qué, con quién los compartimos y qué podés ` +
        `hacer al respecto. Está escrito para que se entienda, no para cubrirnos.`
      }
    >
      <h2>Lo importante, en cuatro líneas</h2>
      <ul>
        <li>
          Si abrís la tarjeta de un profesional: <strong>no te identificamos</strong>. No
          usamos cookies, no guardamos tu IP ni tu teléfono, y no podemos saber si ya
          habías entrado antes.
        </li>
        <li>
          Si sos cliente nuestro: tratamos los datos que vos elegiste publicar en tu
          tarjeta, más tu email para que puedas entrar a tu panel.
        </li>
        <li>No vendemos datos a nadie, ni hacemos publicidad con ellos.</li>
        <li>
          Podés pedirnos acceso, corrección o borrado escribiendo a{' '}
          <DatoLegal valor={LEGAL.emailPrivacidad} que="el email de privacidad" />.
        </li>
      </ul>

      <h2>1. Quién es responsable</h2>
      <p>
        El responsable del tratamiento de los datos personales recogidos a través de este
        sitio es <DatoLegal valor={LEGAL.titular} que="el titular o razón social" />, CUIT{' '}
        <DatoLegal valor={LEGAL.cuit} que="el CUIT" />, con domicilio en{' '}
        <DatoLegal valor={LEGAL.domicilio} que="el domicilio" />, {MARCA.provincia} (en
        adelante, «{MARCA.nombre}», «nosotros»).
      </p>
      <p>
        Para cualquier cuestión vinculada a tus datos personales, el canal de contacto es{' '}
        <DatoLegal valor={LEGAL.emailPrivacidad} que="el email de privacidad" />.
      </p>

      <h2>2. Qué datos tratamos, según quién seas</h2>

      <h3>2.1. Si visitás la tarjeta digital de un profesional</h3>
      <p>
        Es el caso más común: alguien te acercó una tarjeta al teléfono y se abrió su
        página. En ese caso <strong>no recogemos ningún dato personal tuyo</strong>.
        Concretamente, y para que quede por escrito, no guardamos:
      </p>
      <ul>
        <li>tu dirección IP;</li>
        <li>el modelo de tu teléfono ni tu navegador (user-agent);</li>
        <li>cookies, identificadores publicitarios ni huellas de dispositivo;</li>
        <li>tu ubicación;</li>
        <li>ningún identificador que permita reconocerte entre dos visitas.</li>
      </ul>
      <p>
        Lo único que se registra es un conteo anónimo: que <em>alguien</em> abrió esa
        página, o que <em>alguien</em> tocó un botón determinado, con la fecha y hora, y
        el dominio desde el que se llegó (por ejemplo «google.com»), sin la dirección
        completa. Esos registros no están asociados a ninguna persona y no se pueden
        volver a asociar: no existe el dato que lo permitiría. Sirven para que el
        profesional sepa si su tarjeta se usa, no para saber quién la usó.
      </p>
      <p>
        Para que la página funcione, nuestro proveedor de hosting procesa técnicamente tu
        dirección IP durante la conexión —es inevitable: sin la IP no hay forma de
        mandarte la página— y la conserva en sus registros de seguridad por un plazo
        breve. Nosotros no accedemos a esos registros para identificar visitantes ni los
        cruzamos con los datos de arriba. Ver la sección 5.
      </p>
      <p>
        Si tocás «Guardar contacto», el archivo con los datos del profesional se descarga
        a tu teléfono y queda en tu agenda: eso ocurre en tu dispositivo y nosotros no nos
        enteramos de que pasó, más allá del conteo anónimo del botón.
      </p>

      <h3>2.2. Si nos escribís por WhatsApp</h3>
      <p>
        El formulario de contacto del sitio no envía nada a nuestros servidores ni guarda
        lo que escribís: arma un mensaje y abre WhatsApp para que lo mandes vos. A partir
        de ahí la conversación se rige por las condiciones de WhatsApp (WhatsApp LLC, del
        grupo Meta), que es quien la transporta y la almacena. Nosotros vemos y
        conservamos ese chat como cualquier persona conserva sus conversaciones, y lo
        usamos sólo para responderte y, si avanzamos, para prestarte el servicio.
      </p>

      <h3>2.3. Si sos cliente</h3>
      <p>Tratamos dos conjuntos de datos bien distintos:</p>
      <ul>
        <li>
          <strong>Los datos de tu tarjeta</strong> (nombre, profesión, presentación,
          fotos, teléfono, email, dirección, redes y links). Son datos que elegiste
          publicar y que son públicos por definición: el producto que contrataste consiste
          en mostrarlos a quien acerque tu tarjeta. Vos decidís qué cargar y qué no.
        </li>
        <li>
          <strong>Los datos de tu cuenta</strong>: tu dirección de email, que usamos para
          que entres al panel y para avisarte cosas del servicio. Si elegiste contraseña,
          se guarda cifrada (con función de hash) y no podemos verla.
        </li>
      </ul>
      <p>
        También llevamos un registro interno de las tarjetas físicas que te entregamos
        (fecha y si fue una reposición), para administrar el stock y las garantías.
      </p>

      <h2>3. Para qué usamos los datos y con qué base legal</h2>
      <ul>
        <li>
          <strong>Prestar el servicio contratado</strong> (publicar tu tarjeta, darte
          acceso al panel, entregarte las tarjetas físicas). Base: la ejecución del
          contrato entre vos y nosotros.
        </li>
        <li>
          <strong>Facturar y cumplir obligaciones legales</strong> (impositivas,
          contables). Base: obligación legal.
        </li>
        <li>
          <strong>Estadísticas anónimas de uso</strong> del perfil. Base: no involucra
          datos personales, por lo que no requiere consentimiento.
        </li>
        <li>
          <strong>Responder tus consultas</strong>. Base: tu propia solicitud.
        </li>
      </ul>
      <p>
        No hacemos perfilado, no tomamos decisiones automatizadas sobre personas y no
        hacemos publicidad segmentada.
      </p>

      <h2>4. Cuánto tiempo los conservamos</h2>
      <ul>
        <li>
          <strong>Datos de tu tarjeta y de tu cuenta</strong>: mientras dure la relación
          comercial. Si das de baja el servicio, los conservamos hasta 12 meses por si
          querés reactivarlo —una tarjeta física dada de baja sigue existiendo en el mundo
          y es habitual que el cliente vuelva— y después los eliminamos. Podés pedir el
          borrado antes, en cualquier momento.
        </li>
        <li>
          <strong>Registros de conteo anónimos</strong>: se conservan mientras exista el
          perfil. Como no son datos personales, su conservación no afecta a nadie.
        </li>
        <li>
          <strong>Documentación fiscal</strong>: el plazo que exige la normativa
          impositiva argentina, con independencia de lo anterior.
        </li>
      </ul>

      <h2>5. Con quién los compartimos</h2>
      <p>
        No vendemos, alquilamos ni cedemos datos personales. Sí nos apoyamos en
        proveedores que actúan como encargados del tratamiento y que tienen acceso técnico
        a la infraestructura:
      </p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (Estados Unidos) — hosting del sitio. Procesa las
          conexiones y conserva registros técnicos de seguridad.
        </li>
        <li>
          <strong>Supabase Inc.</strong> (Estados Unidos) — base de datos, autenticación y
          almacenamiento de las fotos.
        </li>
        <li>
          <strong>WhatsApp LLC</strong> (grupo Meta) — sólo si elegís escribirnos por ese
          canal.
        </li>
      </ul>
      <p>
        Estos proveedores están radicados en países que la normativa argentina no incluye
        entre los de «protección adecuada», por lo que la transferencia internacional se
        ampara en la necesidad de ejecutar el contrato y en las cláusulas contractuales de
        cada proveedor, conforme al art. 12 de la Ley 25.326.
      </p>
      <p>
        Dato menor pero que cambia algo: las tipografías del sitio se sirven desde nuestro
        propio dominio y no desde Google Fonts, así que tu navegador no hace ningún pedido
        a Google al abrir una tarjeta.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Conforme a la Ley 25.326 de Protección de los Datos Personales, tenés derecho a
        acceder a tus datos, rectificarlos si son inexactos, actualizarlos y pedir su
        supresión, así como a oponerte a determinados tratamientos. Para ejercerlos,
        escribinos a{' '}
        <DatoLegal valor={LEGAL.emailPrivacidad} que="el email de privacidad" />{' '}
        indicando qué querés y acreditando tu identidad. Te respondemos dentro de los 10
        días corridos para el acceso y de los 5 días hábiles para la rectificación o
        supresión, que son los plazos que fija la ley.
      </p>
      <p>
        El titular de los datos personales tiene la facultad de ejercer el derecho de
        acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses,
        salvo que se acredite un interés legítimo al efecto, conforme lo establecido en el
        artículo 14, inciso 3 de la Ley 25.326.
      </p>
      <p>
        La <strong>Agencia de Acceso a la Información Pública</strong>, órgano de control
        de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que
        interpongan quienes resulten afectados en sus derechos por incumplimiento de las
        normas vigentes en materia de protección de datos personales.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Todo el sitio viaja cifrado (HTTPS). El acceso a los datos está restringido por
        políticas a nivel de base de datos: cada cliente sólo puede leer y modificar su
        propio perfil, y esa restricción la aplica el motor de base de datos, no sólo la
        interfaz. Las contraseñas se guardan cifradas con funciones de hash y ni siquiera
        nosotros podemos verlas.
      </p>
      <p>
        Ningún sistema es infalible. Si detectáramos un incidente de seguridad que afecte
        tus datos, te lo vamos a informar y lo comunicaremos a la autoridad de control
        cuando corresponda.
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        El servicio está dirigido a profesionales y comercios, y no está pensado para
        menores de 18 años. No recogemos deliberadamente datos de menores.
      </p>

      <h2>9. Cambios</h2>
      <p>
        Si cambiamos esta política, actualizamos la fecha de vigencia del encabezado y, si
        el cambio es relevante, se lo avisamos a los clientes por email. Las versiones
        anteriores quedan registradas en el historial del código del sitio.
      </p>

      <p>
        Ver también: <Link href="/cookies">política de cookies</Link> y{' '}
        <Link href="/terminos">términos y condiciones</Link>.
      </p>
    </Documento>
  )
}
