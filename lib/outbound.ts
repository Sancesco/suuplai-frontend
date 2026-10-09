import { getSupabaseAdmin } from './supabaseAdmin'
import { slugify } from './aplicaciones'
import { elegirBrazo, type Brazo } from './bandit'
import { rellenar, topeRampa } from './outboundSend'
export { getSupabaseAdmin } from './supabaseAdmin'
export { checkRh as checkOutbound } from './interview' // misma contraseña de admin (x-admin-password)

// Elige el asunto (brazo del bandit) para el toque 1 y cuenta el envío del brazo.
export async function elegirAsunto(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  vars: { nombre: string; empresa: string; slug: string; gancho?: string },
): Promise<{ brazoId: string | null; asunto: string | null }> {
  const { data } = await sb.from('outbound_brazo').select('*').eq('perilla', 'asunto').eq('activa', true)
  const b = elegirBrazo((data ?? []) as Brazo[])
  if (!b) return { brazoId: null, asunto: null }
  await sb.from('outbound_brazo').update({ envios: b.envios + 1 }).eq('id', b.id)
  return { brazoId: b.id, asunto: rellenar(b.texto, vars) }
}

const parseFranja = (t: string): [number, number] => { const [a, b] = (t || '10-12').split('-').map(Number); return [a || 8, b || 17] }

// Programa el toque 1: elige franja (bandit) y el primer día hábil con cupo (usa el de hoy si
// queda espacio y aún es horario; si no, el siguiente). Guarda programado_en + brazo_hora.
export async function programarEnvio(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, prospectoId: string): Promise<string | null> {
  const { data: cfg } = await sb.from('outbound_config').select('clave,valor')
  const cm = new Map((cfg ?? []).map((r: { clave: string; valor: unknown }) => [r.clave, r.valor]))
  const tope = topeRampa(String(cm.get('rampa_desde') || new Date().toISOString()))
  const { data: hArms } = await sb.from('outbound_brazo').select('*').eq('perilla', 'hora').eq('activa', true)
  const franjas = (hArms ?? []) as Brazo[]
  const pref = elegirBrazo(franjas)
  const [ph1, ph2] = parseFranja(pref?.texto || '10-12')

  const now = new Date()
  const cdmxNow = new Date(now.getTime() - 6 * 3600000)
  const curHora = cdmxNow.getUTCHours() + cdmxNow.getUTCMinutes() / 60
  for (let off = 0; off < 21; off++) {
    const d = new Date(Date.UTC(cdmxNow.getUTCFullYear(), cdmxNow.getUTCMonth(), cdmxNow.getUTCDate() + off))
    const dow = d.getUTCDay(); if (dow === 0 || dow === 6) continue
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), dd = d.getUTCDate()
    const dayStart = new Date(Date.UTC(y, m, dd, 6, 0, 0)).toISOString()
    const dayEnd = new Date(Date.UTC(y, m, dd + 1, 6, 0, 0)).toISOString()
    const { count } = await sb.from('outbound_prospecto').select('id', { count: 'exact', head: true }).gte('programado_en', dayStart).lt('programado_en', dayEnd)
    if ((count ?? 0) >= tope) continue
    let hora: number
    if (off === 0) {
      if (curHora >= 16.9) continue // hoy ya casi cierra → siguiente día
      const lo = Math.max(8, Math.min(ph1, 16), curHora + 0.05) // no en el pasado
      const hi = Math.max(lo + 0.1, Math.min(17, Math.max(ph2, curHora + 2)))
      hora = lo + Math.random() * (hi - lo)
    } else {
      hora = ph1 + Math.random() * Math.max(0.2, ph2 - ph1)
    }
    hora = Math.max(8, Math.min(16.95, hora))
    const hInt = Math.floor(hora), minInt = Math.floor((hora - hInt) * 60)
    const programado = new Date(Date.UTC(y, m, dd, hInt + 6, minInt, 0)).toISOString()
    // brazo_hora = la franja que realmente cubre la hora (para que el aprendizaje sea fiel)
    const arm = franjas.find((a) => { const [a1, a2] = parseFranja(a.texto); return hora >= a1 && hora < a2 }) || pref
    await sb.from('outbound_prospecto').update({ programado_en: programado, brazo_hora: arm?.id ?? null }).eq('id', prospectoId)
    if (arm) await sb.from('outbound_brazo').update({ envios: arm.envios + 1 }).eq('id', arm.id)
    return programado
  }
  return null
}

// A dónde lleva el link rastreado /r/<slug> ("mira lo que construí"): el proyecto Suuplai.
export const PROYECTO_PATH = '/'

// CVs default por idioma (ya subidos al bucket aplicaciones-cv). Editables aquí.
export const CV_DEFAULT: Record<'es' | 'en', { url: string; nombre: string }> = {
  es: { url: 'https://umgienrvpnzoaaztkejd.supabase.co/storage/v1/object/public/aplicaciones-cv/38b17a84-ccc1-448e-a195-d1651045e2eb/1791299751822.pdf', nombre: 'Cespedes_Santiago_CV_2026.pdf' },
  en: { url: 'https://umgienrvpnzoaaztkejd.supabase.co/storage/v1/object/public/aplicaciones-cv/3c90249c-b05c-43ee-b133-2c3edf2aa885/1791222653530.pdf', nombre: 'Santiago_Cespedes_CV_EN.pdf' },
}

export type Prospecto = {
  id: string; empresa: string; persona: string | null; puesto: string | null; email: string | null
  sitio_web: string | null; linkedin: string | null; sector: string | null; idioma: string
  slug: string | null; app_id: string | null; estado: string; pausado: boolean; nota: string | null; created_at: string
  gancho?: string | null; cita?: string | null; confianza?: string | null; afirma_cifra?: boolean
  angulo?: string | null; asunto_sugerido?: string | null; evidencia_url?: string | null; auto_enviable?: boolean
}

// Genera un slug único no usado en app_applications, links ni outbound_prospecto.
export async function slugUnico(sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>, base: string): Promise<string> {
  const raw = slugify(base)
  for (let i = 0; i < 25; i++) {
    const slug = i === 0 ? raw : `${raw}-${Math.random().toString(36).slice(2, 5)}`
    const [a, l, p] = await Promise.all([
      sb.from('app_applications').select('id').eq('slug', slug).maybeSingle(),
      sb.from('links').select('id').eq('slug', slug).maybeSingle(),
      sb.from('outbound_prospecto').select('id').eq('slug', slug).maybeSingle(),
    ])
    if (!a.data && !l.data && !p.data) return slug
  }
  return `${raw}-${Math.random().toString(36).slice(2, 7)}`
}

// Crea la página de CV (app_applications, solo CV, idioma) + el link rastreado (/r/<slug>).
// Devuelve { slug, appId }.
export async function prepararProspecto(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  p: { empresa: string; persona: string | null; puesto: string | null; idioma: 'es' | 'en' },
): Promise<{ slug: string; appId: string }> {
  const slug = await slugUnico(sb, p.empresa || 'prospecto')
  const cv = CV_DEFAULT[p.idioma] || CV_DEFAULT.es
  const { data: app, error: ea } = await sb.from('app_applications').insert({
    empresa: p.empresa, puesto: p.puesto || '—', persona: p.persona || null, vacante: '',
    solo_cv: true, idioma: p.idioma, cv_url: cv.url, cv_nombre: cv.nombre, slug, estado: 'enviada',
  }).select('id').single()
  if (ea || !app) throw new Error('no se pudo crear la página de CV: ' + (ea?.message || ''))
  // Link rastreado /r/<slug> → el PROYECTO (Suuplai), para "mira lo que construí". El CV va aparte.
  await sb.from('links').insert({ slug, destination: PROYECTO_PATH, label: p.empresa, notify: true, category: 'outbound' })
  return { slug, appId: app.id as string }
}
