import { redirect } from 'next/navigation'
import { Metricas, periodoValido } from '@/components/Metricas'
import { requerirCliente } from '@/lib/auth'
import { CAPACIDADES, type Metrica } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PaginaEstadisticas({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>
}) {
  const { supabase, profile } = await requerirCliente()

  // Doble llave: la base tampoco devolvería los eventos de un perfil que no sea
  // premium (ver la política "events: premium lee los suyos"), pero acá el
  // mensaje es entendible en vez de una tabla vacía sin explicación.
  if (!CAPACIDADES[profile.plan].analytics) redirect('/panel')

  const dias = periodoValido((await searchParams).dias)

  const { data, error } = await supabase.rpc('metricas_perfil', {
    p_profile_id: profile.id,
    p_dias: dias,
  })

  // Una respuesta vacía significa que todavía no hubo actividad; un error es
  // otra cosa. Mostrar ambos como ceros haría que el cliente crea que su
  // tarjeta no tuvo aperturas cuando en realidad no pudimos consultar la base.
  if (error) {
    return (
      <>
        <h2>Estadísticas</h2>
        <div className="mensaje mensaje--error">
          No pudimos cargar las estadísticas ahora. Probá actualizar la página en unos
          minutos.
        </div>
      </>
    )
  }

  return (
    <>
      <h2>Estadísticas</h2>
      <p className="vacio" style={{ padding: 0, marginBottom: '1.5rem' }}>
        Qué pasó con tu tarjeta en los últimos {dias} días.
      </p>

      <Metricas
        metricas={(data as Metrica[] | null) ?? []}
        dias={dias}
        base="/panel/estadisticas"
      />
    </>
  )
}
