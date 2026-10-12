import { aiRawJSON } from '@/lib/ai'
import { PERFIL } from './perfil'
import { enLotes } from './radar'

// Califica con IA qué tan buen match es cada vacante para el perfil REAL de Santiago (0-10) y por qué.
// Esto reemplaza el ranking por palabras clave para ordenar: arriba lo que de verdad le queda.

type FitJob = { titulo: string; empresa?: string | null; ubicacion?: string | null; descripcion?: string | null }
export type Fit = { fit: number; razon: string }

const SYSTEM = `Eres el reclutador de Santiago. Calificas qué tan buen match es una vacante para ÉL.
Perfil: fundador comercial B2B (venta consultiva, prospección en frío, cierre), implementación de IA,
fintech/finanzas (product owner core bancario, carteras de crédito), chief of staff/operaciones. Nivel
medio (no junior, no VP/C-level). Prefiere español y empresas de IA, fintech o SaaS.
Devuelve SOLO JSON: {"fit": <0-10>, "razon": "<una línea directa>"}.
Escala: 0-3 no encaja; 4-6 encaja a medias; 7-8 buen match; 9-10 ideal.
Penaliza lo demasiado senior o demasiado técnico/ingeniería. La razón: por qué encaja o cuál es el gap.`

export async function calificarFit(v: FitJob): Promise<Fit> {
  const user = `PERFIL:\n${PERFIL}\n\nVACANTE:\nPuesto: ${v.titulo}\nEmpresa: ${v.empresa || '—'}\nUbicación: ${v.ubicacion || '—'}\nDescripción: ${(v.descripcion || '').slice(0, 1500)}`
  try {
    const raw = await aiRawJSON(SYSTEM, user, 0.2, 200)
    const j = JSON.parse(raw) as { fit?: number; razon?: string }
    const fit = Math.max(0, Math.min(10, Math.round(Number(j.fit) || 0)))
    return { fit, razon: String(j.razon || '').slice(0, 240) }
  } catch { return { fit: 0, razon: '' } }
}

// Califica varias en paralelo acotado.
export async function calificarVarias<T extends FitJob & { id?: string; clave?: string }>(vs: T[], n = 4): Promise<(T & Fit)[]> {
  const res = await enLotes(vs.map((v) => async () => ({ ...v, ...(await calificarFit(v)) })), n)
  return res.filter(Boolean) as (T & Fit)[]
}
