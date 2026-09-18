import Link from 'next/link'
import { Logo, Marca } from '@/components/Logo'
import { linkWhatsapp, MARCA, MENSAJES, PASOS, PLANES, PREGUNTAS, SLUG_DEMO } from '@/lib/marca'

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

export default function Home() {
  return (
    <>
      <div className="sitio">
        <header className="masthead">
          <Marca className="marca" />
          <p className="masthead__meta">
            {MARCA.provincia}
            <br />
            Est. 2026
          </p>
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
            tu ubicación y tu agenda. Sin apps, sin escanear nada, sin que nadie escriba
            tu nombre mal. Y te guardan el contacto de un toque.
          </p>
          <div className="portada__acciones">
            <a
              className="btn btn--primario btn--grande"
              href={linkWhatsapp(MENSAJES.general)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Pedir presupuesto
            </a>
            <Link className="btn btn--grande" href={`/${SLUG_DEMO}`}>
              Ver una tarjeta de ejemplo
            </Link>
          </div>
          <p className="portada__nota">
            Hechas en {MARCA.ciudad} · Entrega en mano · Tu página queda para siempre
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
                Cambiás de número o sumás una red nueva y lo corregimos en tu página. Las
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
            Los tres incluyen la tarjeta física y tu página propia. La diferencia está en
            cuánto control tenés vos y cuánto querés saber sobre quién te contacta.
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

                <ul className="plan__lista">
                  {plan.incluye.map((item) => (
                    <li key={item}>
                      <span className="plan__marca" aria-hidden="true">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {plan.noIncluye.map((item) => (
                    <li className="plan__falta" key={item}>
                      <span className="plan__marca" aria-hidden="true">
                        ×
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="plan__precio">Precio a medida de cada caso</p>

                <a
                  className={`btn${plan.destacado ? ' btn--primario' : ''}`}
                  href={linkWhatsapp(MENSAJES.plan(plan.nombre))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
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
      </div>

      {/* --- Cierre ------------------------------------------------------- */}
      <section className="cierre">
        <Logo ancho={72} />
        <h2>¿Arrancamos?</h2>
        <p>
          Escribinos por WhatsApp y te contamos cómo sería tu tarjeta. Sin compromiso:
          si no te convence, no pasa nada.
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
        <footer className="pie">
          <p>
            © {new Date().getFullYear()} {MARCA.nombre} · {MARCA.provincia}
          </p>
          <p>
            <Link href="/login">Acceso administradores</Link>
          </p>
        </footer>
      </div>
    </>
  )
}
