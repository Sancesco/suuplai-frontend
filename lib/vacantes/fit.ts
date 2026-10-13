import { aiRawJSON } from '@/lib/ai'
import { PERFIL } from './perfil'
import { enLotes } from './radar'

// Califica con IA qué tan buen match es cada vacante para el perfil REAL de Santiago (0-10) y por qué.
// Esto reemplaza el ranking por palabras clave para ordenar: arriba lo que de verdad le queda.

type FitJob = { titulo: string; empresa?: string | null; ubicacion?: string | null; descripcion?: string | null }
export type Fit = { fit: number; razon: string; sueldoEst: string }

const SYSTEM = `Eres el reclutador de Santiago. Calificas qué tan buen match es una vacante para ÉL.
Perfil: fundador comercial B2B (venta consultiva, prospección en frío, cierre), implementación de IA,
fintech/finanzas (product owner core bancario, carteras de crédito), chief of staff/operaciones. Nivel
medio (no junior, no VP/C-level). Prefiere español y empresas de IA, fintech o SaaS.
Devuelve SOLO JSON: {"fit": <0-10>, "razon": "<una línea directa>", "sueldo_est": "<rango mensual bruto en MXN para ESE puesto en México, ej. '$45,000–60,000 MXN/mes'; estima por el nivel y la industria>"}.
Escala: 0-3 no encaja; 4-6 encaja a medias; 7-8 buen match; 9-10 ideal.
Penaliza lo demasiado senior o demasiado técnico/ingeniería. La razón: por qué encaja o cuál es el gap.
Si te doy PREFERENCIAS APRENDIDAS (puestos que Santiago rechazó o le interesaron), úsalas para calibrar:
BAJA el fit de puestos parecidos a los que RECHAZÓ, SUBE el de los parecidos a los que le INTERESARON.`

// Construye el contexto de aprendizaje a partir de lo que el usuario ya rechazó / le interesó.
export function contextoPreferencias(rechazadas: string[], gustadas: string[]): string {
  if (!rechazadas.length && !gustadas.length) return ''
  const r = rechazadas.slice(0, 25).map((t) => `- ${t}`).join('\n')
  const g = gustadas.slice(0, 15).map((t) => `- ${t}`).join('\n')
  return `PREFERENCIAS APRENDIDAS:\n${g ? `LE INTERESARON:\n${g}\n` : ''}${r ? `RECHAZÓ (no le interesaron):\n${r}` : ''}`
}

export async function calificarFit(v: FitJob, pref = ''): Promise<Fit> {
  const user = `PERFIL:\n${PERFIL}\n\n${pref ? pref + '\n\n' : ''}VACANTE:\nPuesto: ${v.titulo}\nEmpresa: ${v.empresa || '—'}\nUbicación: ${v.ubicacion || '—'}\nDescripción: ${(v.descripcion || '').slice(0, 1500)}`
  try {
    const raw = await aiRawJSON(SYSTEM, user, 0.2, 240)
    const j = JSON.parse(raw) as { fit?: number; razon?: string; sueldo_est?: string }
    const fit = Math.max(0, Math.min(10, Math.round(Number(j.fit) || 0)))
    return { fit, razon: String(j.razon || '').slice(0, 240), sueldoEst: String(j.sueldo_est || '').slice(0, 60) }
  } catch { return { fit: 0, razon: '', sueldoEst: '' } }
}

// Califica varias en paralelo acotado. `pref` = contexto aprendido (lo rechazado / lo que gustó).
export async function calificarVarias<T extends FitJob & { id?: string; clave?: string }>(vs: T[], n = 4, pref = ''): Promise<(T & Fit)[]> {
  const res = await enLotes(vs.map((v) => async () => ({ ...v, ...(await calificarFit(v, pref)) })), n)
  return res.filter(Boolean) as (T & Fit)[]
}
