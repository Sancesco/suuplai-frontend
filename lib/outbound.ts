import { getSupabaseAdmin } from './supabaseAdmin'
import { slugify } from './aplicaciones'
export { getSupabaseAdmin } from './supabaseAdmin'
export { checkRh as checkOutbound } from './interview' // misma contraseña de admin (x-admin-password)

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
