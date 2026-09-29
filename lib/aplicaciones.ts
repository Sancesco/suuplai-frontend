import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { aiRawJSON, parseJSON } from './ai'
export { getSupabaseAdmin } from './supabaseAdmin'
export { checkRh as checkPanel } from './interview' // reusa la contraseña de admin (x-admin-password)

// ── Fuente de verdad ──
export function getPerfil(): string {
  try { return readFileSync(join(process.cwd(), 'content', 'perfil.md'), 'utf8') } catch { return '' }
}

// ── Tipos ──
export type ReqEstado = 'cumple' | 'parcial' | 'no_cumple'
export type Requisito = { texto: string; estado: ReqEstado; evidencia: string }
export type Analysis = {
  requisitos: Requisito[]
  match_pct: number
  veredicto: string
  argumentos: string[]
  huecos: string[]
  obligatoria: string | null // instrucción obligatoria de la vacante (ej. "envía un caso con impacto")
}
export type Application = {
  id: string; slug: string | null; empresa: string; puesto: string; persona: string | null; correo: string | null
  vacante: string; analysis: Analysis | null; posicionamiento: string | null; carta: string | null
  cv_url: string | null; cv_nombre: string | null; video_url: string | null; estado: string; created_at: string
}

// ── Utilidades ──
export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'app'
}
export function ipHash(req: Request): string {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '0.0.0.0'
  const salt = process.env.APP_TRACK_SALT || 'suuplai-aplicaciones'
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16) // solo hash, nunca IP en claro
}
export function deviceOf(req: Request): string {
  const ua = (req.headers.get('user-agent') || '').toLowerCase()
  if (/mobile|iphone|android/.test(ua)) return 'móvil'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'escritorio'
}

// ── Análisis de vacante vs perfil (IA, honesto, sin inventar) ──
const SYSTEM_ANALISIS = `Eres un analista de reclutamiento BRUTALMENTE HONESTO. Comparas una vacante contra el PERFIL de un candidato.
REGLA DURA: solo usas lo que está en el perfil. NUNCA inventes ni infles experiencia, años, tecnologías ni números. Si algo no está en el perfil, es "no_cumple" o "parcial", no lo adornes.
Devuelve SOLO JSON:
{
 "requisitos": [{"texto":"requisito de la vacante","estado":"cumple|parcial|no_cumple","evidencia":"cita concreta del perfil, o '' si no hay"}],
 "match_pct": 0-100 honesto (no lo infles),
 "veredicto": "una frase honesta, sin suavizar",
 "argumentos": ["los 3 argumentos más fuertes del candidato para ESTA vacante"],
 "huecos": ["los huecos reales, explícitos"],
 "obligatoria": "si la vacante trae una instrucción OBLIGATORIA para postularse (ej. 'envía un caso con impacto medible', 'incluye link a portfolio'), ponla aquí como texto; si no hay, null"
}
Sé conciso: cada evidencia y hueco máximo 18 palabras.`

export async function analizarVacante(empresa: string, puesto: string, vacante: string): Promise<Analysis> {
  const perfil = getPerfil()
  const user = `PERFIL DEL CANDIDATO:\n${perfil}\n\nVACANTE (${empresa} — ${puesto}):\n${vacante.slice(0, 8000)}`
  const raw = await aiRawJSON(SYSTEM_ANALISIS, user, 0.2, 1400)
  const p = parseJSON(raw) as Partial<Analysis>
  return {
    requisitos: (Array.isArray(p.requisitos) ? p.requisitos : []).map((r) => ({
      texto: String(r?.texto ?? '').trim(),
      estado: (['cumple', 'parcial', 'no_cumple'].includes(String(r?.estado)) ? r?.estado : 'no_cumple') as ReqEstado,
      evidencia: String(r?.evidencia ?? '').trim(),
    })).filter((r) => r.texto),
    match_pct: Math.max(0, Math.min(100, Math.round(Number(p.match_pct) || 0))),
    veredicto: String(p.veredicto ?? '').trim(),
    argumentos: (Array.isArray(p.argumentos) ? p.argumentos : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 3),
    huecos: (Array.isArray(p.huecos) ? p.huecos : []).map((s) => String(s).trim()).filter(Boolean),
    obligatoria: p.obligatoria ? String(p.obligatoria).trim() : null,
  }
}
