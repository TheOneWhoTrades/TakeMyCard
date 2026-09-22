import Link from 'next/link'
import { requerirAdmin } from '@/lib/auth'
import type { Profile } from '@/lib/types'
import { CuentasPendientes, type CuentaPendiente } from './CuentasPendientes'
import { alternarActivo } from './actions'

export const dynamic = 'force-dynamic'

export default async function PaginaAdmin() {
  const { supabase } = await requerirAdmin()

  const [{ data: profiles, error }, { data: pendientes, error: errorPendientes }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Profile[]>(),
      supabase.rpc('cuentas_sin_perfil'),
    ])

  const cuentas = (pendientes as CuentaPendiente[] | null) ?? []

  return (
    <>
      <div className="admin__barra" style={{ border: 0, marginBottom: '0.5rem' }}>
        <h2 style={{ border: 0, margin: 0 }}>Perfiles ({profiles?.length ?? 0})</h2>
        <Link href="/admin/nuevo" className="btn btn--primario">
          + Nuevo perfil
        </Link>
      </div>

      {error && <div className="mensaje mensaje--error">{error.message}</div>}

      {!profiles?.length ? (
        <p className="vacio">
          Todavía no hay perfiles cargados. Empezá con <Link href="/admin/nuevo">uno nuevo</Link>.
        </p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Plan</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/${p.id}`}>{p.nombre}</Link>
                  {p.profesion && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                      {p.profesion}
                    </div>
                  )}
                </td>
                <td>
                  <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    /{p.slug}
                  </a>
                  <div style={{ fontSize: '0.75rem', color: 'var(--texto-suave)' }}>
                    chip: /t/{p.codigo_corto}
                  </div>
                </td>
                <td>
                  <span className={`pastilla pastilla--${p.plan}`}>{p.plan}</span>
                </td>
                <td>
                  <span className={`pastilla ${p.activo ? 'pastilla--ok' : 'pastilla--off'}`}>
                    {p.activo ? 'activo' : 'pausado'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <form action={alternarActivo}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="activo" value={String(p.activo)} />
                    <button type="submit" className="btn btn--mini">
                      {p.activo ? 'Pausar' : 'Activar'}
                    </button>
                  </form>{' '}
                  <Link href={`/admin/${p.id}`} className="btn btn--mini">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Cuentas esperando alta ({cuentas.length})</h2>
      {errorPendientes ? (
        <div className="mensaje mensaje--error">
          No se pudo leer la lista de cuentas pendientes: {errorPendientes.message}. Si
          dice que la función no existe, falta aplicar la última migración.
        </div>
      ) : (
        <CuentasPendientes
          cuentas={cuentas}
          perfiles={(profiles ?? []).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            slug: p.slug,
            plan: p.plan,
          }))}
        />
      )}
    </>
  )
}
