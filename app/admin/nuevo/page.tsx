import Link from 'next/link'
import { FormularioPerfil } from '../FormularioPerfil'

export default function PaginaNuevoPerfil() {
  return (
    <>
      <p>
        <Link href="/admin">← Volver al listado</Link>
      </p>
      <h2>Nuevo perfil</h2>
      <p className="vacio" style={{ padding: 0, marginBottom: '1rem' }}>
        Cargá los datos básicos. Los botones de contacto se agregan después de crear el
        perfil.
      </p>
      <FormularioPerfil />
    </>
  )
}
