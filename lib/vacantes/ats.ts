import { type Vacante, strip, enLotes } from './radar'

// Lectores de los job boards públicos de Greenhouse, Lever y Ashby (sin llave, solo lectura).
// Verificado con curl: shapes abajo. Nunca se usa el endpoint POST de aplicaciones.

const TIMEOUT = 8000
async function getJSON(url: string): Promise<unknown | null> {
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), TIMEOUT)
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'suuplai-vacantes' } })
    clearTimeout(t)
    if (!r.ok) return r.status === 404 ? { _status: 404 } : null
    return await r.json()
  } catch { return null }
}

// ─── Greenhouse ───────────────────────────────────────────────────────────────
type GhJob = { id: number; title: string; location?: { name?: string }; content?: string; absolute_url?: string; updated_at?: string; company_name?: string }
export async function leerGreenhouse(token: string): Promise<{ vacantes: Vacante[]; invalido: boolean }> {
  const d = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`)
  if (d && (d as { _status?: number })._status === 404) return { vacantes: [], invalido: true }
  const jobs = (d as { jobs?: GhJob[] } | null)?.jobs || []
  const vacantes = jobs.map((j): Vacante => ({
    titulo: j.title || '', empresa: j.company_name || token, ubicacion: j.location?.name || '',
    descripcion: strip(j.content), sueldo: '', link: j.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${j.id}`,
    fecha_publicada: (j.updated_at || '').slice(0, 10) || null, fuente: 'Greenhouse',
    ats: 'greenhouse', ats_token: token, ats_job_id: String(j.id),
  }))
  return { vacantes, invalido: false }
}

export type Pregunta = { label: string; required: boolean; name: string; type: string; opciones: string[]; auto: boolean }
// Campos que Simplify (o el autofill del navegador) ya llena: no los contesta la IA.
const AUTO = /first_name|last_name|full_name|email|phone|resume|cv|cover_letter|linkedin|github|website|portfolio|location|city|address|gender|race|ethnic|veteran|disab|hispanic|pronoun/i
type GhQ = { label?: string; required?: boolean; fields?: { name?: string; type?: string; values?: { value?: string; label?: string }[] }[] }
export async function leerPreguntasGreenhouse(token: string, jobId: string): Promise<Pregunta[]> {
  const d = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs/${jobId}?questions=true`)
  const qs = (d as { questions?: GhQ[] } | null)?.questions || []
  return qs.map((q): Pregunta => {
    const f = q.fields?.[0]
    const name = f?.name || ''
    const opciones = (f?.values || []).map((v) => String(v.value ?? v.label ?? '')).filter(Boolean)
    return { label: q.label || name, required: !!q.required, name, type: f?.type || 'input_text', opciones, auto: AUTO.test(name + ' ' + (q.label || '')) }
  })
}

// ─── Lever ────────────────────────────────────────────────────────────────────
type LvJob = { id: string; text?: string; categories?: { location?: string; allLocations?: string[]; commitment?: string }; descriptionPlain?: string; hostedUrl?: string; applyUrl?: string; workplaceType?: string }
export async function leerLever(token: string): Promise<{ vacantes: Vacante[]; invalido: boolean }> {
  const d = await getJSON(`https://api.lever.co/v0/postings/${token}?mode=json`)
  if (d && (d as { _status?: number })._status === 404) return { vacantes: [], invalido: true }
  const jobs = (Array.isArray(d) ? d : []) as LvJob[]
  const vacantes = jobs.map((j): Vacante => ({
    titulo: j.text || '', empresa: token, ubicacion: j.categories?.location || (j.categories?.allLocations || []).join(', ') || (j.workplaceType === 'remote' ? 'Remoto' : ''),
    descripcion: strip(j.descriptionPlain), sueldo: '', link: j.hostedUrl || j.applyUrl || '',
    fecha_publicada: null, fuente: 'Lever', ats: 'lever', ats_token: token, ats_job_id: j.id,
  }))
  return { vacantes, invalido: false }
}

// ─── Ashby ────────────────────────────────────────────────────────────────────
type AbJob = { id: string; title?: string; location?: string; secondaryLocations?: { location?: string }[]; isRemote?: boolean; descriptionPlain?: string; jobUrl?: string; applyUrl?: string; isListed?: boolean }
export async function leerAshby(token: string): Promise<{ vacantes: Vacante[]; invalido: boolean }> {
  const d = await getJSON(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`)
  if (d && (d as { _status?: number })._status === 404) return { vacantes: [], invalido: true }
  const jobs = ((d as { jobs?: AbJob[] } | null)?.jobs || []).filter((j) => j.isListed !== false)
  const vacantes = jobs.map((j): Vacante => ({
    titulo: j.title || '', empresa: token, ubicacion: j.location || (j.isRemote ? 'Remoto' : ''),
    descripcion: strip(j.descriptionPlain), sueldo: '', link: j.jobUrl || j.applyUrl || '',
    fecha_publicada: null, fuente: 'Ashby', ats: 'ashby', ats_token: token, ats_job_id: j.id,
  }))
  return { vacantes, invalido: false }
}

// Lee una empresa según su ATS. Devuelve vacantes + si el token resultó inválido (404).
export async function leerEmpresa(ats: string, token: string): Promise<{ vacantes: Vacante[]; invalido: boolean }> {
  if (ats === 'greenhouse') return leerGreenhouse(token)
  if (ats === 'lever') return leerLever(token)
  if (ats === 'ashby') return leerAshby(token)
  return { vacantes: [], invalido: false }
}

// ¿Existe este token en este ATS y tiene al menos una vacante? (para el descubrimiento por sondeo)
export async function existeEnAts(ats: string, token: string): Promise<boolean> {
  const { vacantes, invalido } = await leerEmpresa(ats, token)
  return !invalido && vacantes.length > 0
}

export { enLotes }
