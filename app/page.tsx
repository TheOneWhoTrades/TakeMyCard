import Link from 'next/link'
import { FormularioContacto } from '@/components/FormularioContacto'
import { Logo, Marca } from '@/components/Logo'
import { PieSitio } from '@/components/PieSitio'
import {
  COMPARATIVA,
  CTA_ASESOR,
  CTA_PLAN,
  linkWhatsapp,
  MARCA,
  MENSAJES,
  PASOS,
  PLANES,
  PREGUNTAS,
  SLUG_DEMO,
  esPiloto,
  type FilaComparativa,
} from '@/lib/marca'

/**
 * Sitio comercial. Es la página que ve alguien que googlea el proyecto o que
 * recibe el link por WhatsApp: tiene que explicar qué es, mostrarlo funcionando
 * y terminar en una conversación.
 *
 * Es estática a propósito --no consulta la base-- así que Vercel la sirve desde
 * el borde y abre instantáneo.
 */

export const metadata = {
  alternates: { canonical: '/' },
}

/** Una celda de la tabla comparativa: Sí, No, o un texto propio. */
function Celda({ valor }: { valor: FilaComparativa[keyof FilaComparativa] }) {
  if (valor === true) {
    return (
      <span className="comparativa__si">
        <span aria-hidden="true">✓</span>
        <span className="visualmente-oculto">Incluido</span>
      </span>
    )
  }
  if (valor === false) {
    return (
      <span className="comparativa__no">
        <span aria-hidden="true">—</span>
        <span className="visualmente-oculto">No incluido</span>
      </span>
    )
  }
  return <span className="comparativa__texto">{valor}</span>
}

export default function Home() {
  return (
    <>
      <div className="sitio">
        <header className="masthead">
          <Marca className="marca" />

          {/* El acceso al panel vivía sólo en el pie, en letra chica. El cliente
              que entra a editar su página no viene a leer la home: viene a
              entrar, y tiene que encontrar por dónde sin scrollear hasta el
              fondo. */}
          <div className="masthead__acciones">
            <p className="masthead__meta">
              {MARCA.provincia}
              <br />
              Est. 2026
            </p>
            <Link href="/ingresar" className="btn btn--mini">
              Ingresar a mi panel
            </Link>
          </div>
        </header>

        {/* --- Portada --------------------------------------------------- */}
        <section className="portada">
          <p className="volanta">{MARCA.eslogan}</p>
          <h1 className="portada__titulo">
            Tu tarjeta personal,
            <br />
            en el celular del otro
          </h1>
          <p className="portada__bajada">
            Acercás tu tarjeta a un teléfono y se abre tu página: tu WhatsApp, tus redes,
            tu ubicación y tu agenda. En teléfonos compatibles, sin apps ni escanear nada, sin
            que nadie escriba tu nombre mal. Y te guardan el contacto de un toque.
          </p>
          <div className="portada__acciones">
            <a
              className="btn btn--primario btn--grande"
              href={linkWhatsapp(MENSAJES.general)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CTA_ASESOR}
            </a>
            <Link className="btn btn--grande" href={`/${SLUG_DEMO}`}>
              Ver una tarjeta de ejemplo
            </Link>
          </div>
          <p className="portada__nota">
            Hechas en {MARCA.ciudad} · Dos tarjetas incluidas · Entrega en mano
          </p>
        </section>

        {/* --- Cómo funciona --------------------------------------------- */}
        <section className="seccion" id="como-funciona">
          <p className="volanta">Cómo funciona</p>
          <h2 className="seccion__titulo">Tres pasos y listo</h2>
          <p className="seccion__bajada">
            No tenés que saber nada de tecnología. De la parte técnica nos ocupamos
            nosotros; vos ponés los datos y repartís las tarjetas.
          </p>
          <hr className="filete" />

          <div className="columnas">
            {PASOS.map((paso, i) => (
              <article className="columna" key={paso.titulo}>
                <span className="columna__numero">{i + 1}</span>
                <h3 className="columna__titulo">{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --- Por qué NFC ----------------------------------------------- */}
        <section className="seccion" id="por-que">
          <p className="volanta">Por qué cambiar el papel</p>
          <h2 className="seccion__titulo">La tarjeta de papel se pierde. Esta no.</h2>
          <p className="seccion__bajada">
            Una tarjeta de papel termina en un bolsillo, se lava con el pantalón o queda
            en un cajón. Y cuando cambiás de teléfono, de dirección o de redes, quedás
            con cien tarjetas impresas que ya no sirven.
          </p>
          <hr className="filete" />

          <div className="columnas">
            <article className="columna">
              <h3 className="columna__titulo">Entra directo a la agenda</h3>
              <p>
                El que recibe tu tarjeta toca «Guardar contacto» y quedás en su teléfono
                con tu foto, tu teléfono y tu mail. No hay paso intermedio donde se
                pierda la intención.
              </p>
            </article>
            <article className="columna">
              <h3 className="columna__titulo">Se actualiza sola</h3>
              <p>
                Cambiás de número o sumás una red nueva y se corrige en tu página. Las
                tarjetas que ya repartiste apuntan al lugar correcto: no hay que
                reimprimir ni reprogramar nada.
              </p>
            </article>
            <article className="columna">
              <h3 className="columna__titulo">Se nota</h3>
              <p>
                Apoyar una tarjeta sobre un celular y que se abra una página es un gesto
                que la gente no vio mil veces. En una reunión o en un mostrador, eso solo
                ya deja una impresión.
              </p>
            </article>
          </div>
        </section>

        {/* --- Planes ----------------------------------------------------- */}
        <section className="seccion" id="planes">
          <p className="volanta">Planes</p>
          <h2 className="seccion__titulo">Elegí hasta dónde querés llegar</h2>
          <p className="seccion__bajada">
            Los tres incluyen dos tarjetas físicas y tu página propia. La diferencia está
            en cuánto control tenés vos y cuánto querés saber sobre quién te contacta.
          </p>
          <hr className="filete" />

          <div className="planes">
            {PLANES.map((plan) => (
              <article
                className={`plan${plan.destacado ? ' plan--destacado' : ''}`}
                key={plan.id}
              >
                {plan.destacado && <span className="plan__sello">El más elegido</span>}

                <h3 className="plan__nombre">{plan.nombre}</h3>
                <p className="plan__para">{plan.para}</p>

                <p className="plan__precio">{plan.precio.principal}</p>
                <p className="plan__precio-detalle">{plan.precio.detalle}</p>

                <a
                  className={`btn${plan.destacado ? ' btn--primario' : ''}`}
                  href={linkWhatsapp(MENSAJES.plan(plan.nombre))}
                  target="_blank"
                  rel="noopener noreferrer"
                  /* Los tres botones dicen lo mismo, así que el nombre
                     accesible lleva el plan: quien navega por botones con un
                     lector de pantalla escucharía tres veces «Quiero mi
                     tarjeta» sin saber cuál es cuál. */
                  aria-label={`${CTA_PLAN} — plan ${plan.nombre}`}
                >
                  {CTA_PLAN}
                </a>
              </article>
            ))}
          </div>

          {/* La comparativa completa, fila por fila. Es la tabla que decide la
              compra: el que llega hasta acá quiere saber exactamente qué cambia. */}
          <p className="comparativa__aviso">Deslizá la tabla para ver los tres planes →</p>
          <div className="comparativa__caja">
            <table className="comparativa">
              <caption className="visualmente-oculto">
                Comparación de funciones entre los planes Básico, Plus y Premium
              </caption>
              <thead>
                <tr>
                  <th scope="col">Función</th>
                  {PLANES.map((plan) => (
                    <th scope="col" key={plan.id}>
                      {plan.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARATIVA.map((fila) => (
                  <tr key={fila.funcion}>
                    <th scope="row">
                      {fila.funcion}
                      {fila.nota && <span className="comparativa__nota">{fila.nota}</span>}
                    </th>
                    <td>
                      <Celda valor={fila.basico} />
                    </td>
                    <td>
                      <Celda valor={fila.plus} />
                    </td>
                    <td>
                      <Celda valor={fila.premium} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Precio</th>
                  {PLANES.map((plan) => (
                    <td key={plan.id}>
                      <span className="comparativa__texto">{plan.precio.principal}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="seccion__pie">
            Las tarjetas de repuesto se venden aparte. Las condiciones completas están en los{' '}
            <Link href="/terminos">términos y condiciones</Link>.
            {/* Mientras no haya identificación completa del oferente, publicar
                precios al público conviene acompañarlo de la etapa real del
                proyecto. Desaparece solo al cargar los datos en LEGAL. */}
            {esPiloto() && (
              <>
                {' '}
                Estamos en etapa de prueba: los precios son los previstos para el lanzamiento y
                todavía no se realizan cobros. El medio de pago y la conversión se definirán antes
                de comercializar el servicio.
              </>
            )}
          </p>
        </section>

        {/* --- Preguntas --------------------------------------------------- */}
        <section className="seccion" id="preguntas">
          <p className="volanta">Preguntas frecuentes</p>
          <h2 className="seccion__titulo">Lo que todos preguntan</h2>
          <hr className="filete" />

          <div className="preguntas">
            {PREGUNTAS.map((item) => (
              <article className="pregunta" key={item.p}>
                <h3 className="pregunta__p">{item.p}</h3>
                <p className="pregunta__r">{item.r}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --- Cuenta ------------------------------------------------------ */}
        <section className="seccion" id="cuenta">
          <p className="volanta">¿Ya sos cliente?</p>
          <h2 className="seccion__titulo">Tu panel de autoedición</h2>
          <p className="seccion__bajada">
            Con los planes Plus y Premium editás tu página vos mismo: tus datos, tus
            botones, tus fotos y tu color, desde el celular y sin pedirle permiso a nadie.
          </p>
          <hr className="filete" />

          <div className="cuenta">
            <div className="cuenta__paso">
              <span className="columna__numero">1</span>
              <h3 className="columna__titulo">Creás tu cuenta</h3>
              <p>
                Con tu email y una contraseña. Usá el mismo email que nos diste al
                contratar.
              </p>
            </div>
            <div className="cuenta__paso">
              <span className="columna__numero">2</span>
              <h3 className="columna__titulo">La habilitamos nosotros</h3>
              <p>
                Vinculamos tu cuenta con tu tarjeta. Hasta que lo hacemos, la cuenta no
                abre nada: es el paso que nos asegura que sos vos.
              </p>
            </div>
            <div className="cuenta__paso">
              <span className="columna__numero">3</span>
              <h3 className="columna__titulo">Editás cuando quieras</h3>
              <p>
                Entrás con tu email —con contraseña o con un enlace de un solo uso— y los
                cambios se ven al toque en todas tus tarjetas.
              </p>
            </div>
          </div>

          <div className="cuenta__acciones">
            <Link className="btn btn--primario btn--grande" href="/crear-cuenta">
              Crear mi cuenta
            </Link>
            <Link className="btn btn--grande" href="/ingresar">
              Ya tengo cuenta, quiero entrar
            </Link>
          </div>

          <p className="seccion__pie">
            Con el plan Básico no hace falta cuenta: los cambios los hacemos nosotros
            cuando los pedís.
          </p>
        </section>

        {/* --- Contacto ---------------------------------------------------- */}
        <section className="seccion" id="contacto">
          <p className="volanta">Contacto</p>
          <h2 className="seccion__titulo">Contanos qué necesitás</h2>
          <p className="seccion__bajada">
            Completá lo que quieras y seguimos por WhatsApp. Sin compromiso: si no te
            convence, no pasa nada.
          </p>
          <hr className="filete" />

          <FormularioContacto />
        </section>
      </div>

      {/* --- Cierre ------------------------------------------------------- */}
      <section className="cierre">
        <Logo ancho={72} />
        <h2>¿Arrancamos?</h2>
        <p>
          Escribinos y te contamos cómo sería tu tarjeta. Te mostramos la página antes de
          imprimir nada.
        </p>
        <a
          className="btn btn--grande"
          href={linkWhatsapp(MENSAJES.general)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribir por WhatsApp
        </a>
      </section>

      <div className="sitio">
        <PieSitio />
      </div>
    </>
  )
}
