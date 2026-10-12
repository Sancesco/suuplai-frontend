import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { type Vacante, correrAgregadores, pasa, rankear, claveDe, enLotes } from './radar'
import { leerEmpresa } from './ats'
import { descubrirDesdeLinks, descubrirPorNombre } from './descubrir'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>
type EmpresaObjetivo = { id: string; nombre: string; ats: string; token: string; revisiones_vacias: number }

// Revisa todas las empresas objetivo activas; devuelve sus vacantes (ya rankeadas, con bono +3) y
// actualiza su estado (ultima_revision, vacantes_relevantes, revisiones_vacias, pausa a 404 o 14 vacías).
async function revisarEmpresas(sb: SB, minPuntaje: number): Promise<Vacante[]> {
  const { data: emps } = await sb.from('empresas_objetivo').select('id,nombre,ats,token,revisiones_vacias').eq('activa', true).eq('bloqueada', false).limit(400)
  const empresas = (emps ?? []) as EmpresaObjetivo[]
  const todas: Vacante[] = []
  const tareas = empresas.map((e) => async () => {
    const { vacantes, invalido } = await leerEmpresa(e.ats, e.token)
    if (invalido) { await sb.from('empresas_objetivo').update({ activa: false, ultima_revision: new Date().toISOString() }).eq('id', e.id); return }
    const relevantes = vacantes.map((v) => rankear(v, 3)).filter((v) => pasa(v) && (v.puntaje || 0) >= minPuntaje)
    todas.push(...relevantes)
    const vacia = relevantes.length === 0
    const rv = vacia ? (e.revisiones_vacias || 0) + 1 : 0
    await sb.from('empresas_objetivo').update({
      ultima_revision: new Date().toISOString(), vacantes_relevantes: relevantes.length,
      revisiones_vacias: rv, ...(rv >= 14 ? { activa: false } : {}),
    }).eq('id', e.id)
  })
  await enLotes(tareas, 6)
  return todas
}

// Orquestador: agregadores → descubrimiento → empresas ATS → dedup (gana ATS) → filtro.
// descubrir: 'none' (solo lo que ya hay), 'links' (rápido, para el botón), 'full' (cron diario).
export async function correrRadar(sb: SB, opts: { minPuntaje?: number; descubrir?: 'none' | 'links' | 'full' } = {}): Promise<Vacante[]> {
  const minPuntaje = opts.minPuntaje ?? 3
  const modo = opts.descubrir ?? 'none'

  const agregadores = await correrAgregadores()
  if (modo !== 'none') {
    try {
      // Vía 1 (resolver links) siempre, acotada. Vía 2 (sondeo por nombre) solo en el cron.
      await descubrirDesdeLinks(sb, agregadores, modo === 'full' ? 30 : 12)
      if (modo === 'full') await descubrirPorNombre(sb, agregadores.map((v) => v.empresa).filter(Boolean), 8)
    } catch { /* el descubrimiento nunca tumba el radar */ }
  }
  const deEmpresas = await revisarEmpresas(sb, minPuntaje)

  const agregRank = agregadores.map((v) => rankear(v)).filter((v) => pasa(v) && (v.puntaje || 0) >= minPuntaje)

  // Dedup por clave. El ATS gana (link directo + preguntas), así que se mete después y sobrescribe.
  const porClave = new Map<string, Vacante>()
  for (const v of agregRank) porClave.set(v.clave || claveDe(v), v)
  for (const v of deEmpresas) porClave.set(v.clave || claveDe(v), v)

  const ordenadas = Array.from(porClave.values()).sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0))
  // 1 por empresa: se queda el puesto mejor rankeado de cada una (el que más sentido hace), para
  // maximizar la variedad de empresas distintas.
  const vistas = new Set<string>(); const diversas: Vacante[] = []
  for (const v of ordenadas) {
    const k = (v.empresa || '').toLowerCase().trim()
    if (k && vistas.has(k)) continue
    if (k) vistas.add(k)
    diversas.push(v)
  }
  return diversas
}
