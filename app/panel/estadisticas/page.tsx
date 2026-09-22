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

  const { data } = await supabase.rpc('metricas_perfil', {
    p_profile_id: profile.id,
    p_dias: dias,
  })

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
