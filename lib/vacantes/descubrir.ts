import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { type Vacante, detectarAts, enLotes } from './radar'
import { existeEnAts } from './ats'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>
const ATS_LIST = ['greenhouse', 'lever', 'ashby'] as const

// Da de alta (o reactiva) una empresa en empresas_objetivo. Dedup por (ats, token).
async function altaEmpresa(sb: SB, e: { nombre: string; ats: string; token: string; origen: string }) {
  const { data: ex } = await sb.from('empresas_objetivo').select('id,activa,bloqueada').eq('ats', e.ats).eq('token', e.token).maybeSingle()
  if (ex) {
    // Si reaparece por descubrimiento y no está bloqueada, se reactiva (sin tocar bloqueadas).
    if (!ex.bloqueada && !ex.activa) await sb.from('empresas_objetivo').update({ activa: true, revisiones_vacias: 0 }).eq('id', ex.id)
    return
  }
  await sb.from('empresas_objetivo').insert({ nombre: e.nombre || e.token, ats: e.ats, token: e.token, origen: e.origen })
}

// ── Vía 1: resolver el link de los agregadores y ver si aterriza en un ATS ──
async function urlFinal(url: string, saltos = 3): Promise<string> {
  let u = url
  for (let i = 0; i < saltos; i++) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000)
      const r = await fetch(u, { method: 'HEAD', redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': 'suuplai-vacantes' } })
      clearTimeout(t)
      const loc = r.headers.get('location')
      if (r.status >= 300 && r.status < 400 && loc) { u = loc.startsWith('http') ? loc : new URL(loc, u).toString(); continue }
      break
    } catch { break }
  }
  return u
}

export async function descubrirDesdeLinks(sb: SB, vacantes: Vacante[], limite = 40): Promise<number> {
  const candidatos = vacantes.filter((v) => v.link && !detectarAts(v.link).ats).slice(0, limite)
  let altas = 0
  const tareas = candidatos.map((v) => async () => {
    const final = await urlFinal(v.link)
    const det = detectarAts(final)
    if (det.ats && det.ats_token) { await altaEmpresa(sb, { nombre: v.empresa, ats: det.ats, token: det.ats_token, origen: 'agregador' }); altas++ }
  })
  await enLotes(tareas, 4)
  return altas
}

// ── Vía 2: sondear nombres de empresa de los agregadores contra los 3 ATS ──
const SUFIJOS = /\b(s\.?a\.?\s*(de\s*c\.?v\.?)?|s\.?a\.?p\.?i\.?|inc|llc|ltd|co|corp|group|technologies?|tech|labs?|software|m[eé]xico|mx)\b/gi
export function slugsDe(nombre: string): string[] {
  const base = nombre.toLowerCase().replace(SUFIJOS, ' ').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!base) return []
  const palabras = base.split(' ')
  const juntas = palabras.join('')
  const guion = palabras.join('-')
  const primera = palabras[0]
  return Array.from(new Set([juntas, guion, primera].filter((s) => s.length >= 3 && s.length <= 40)))
}

export async function descubrirPorNombre(sb: SB, nombres: string[], limite = 8): Promise<number> {
  // nombres nuevos (no sondeados). Se sondean pocos por corrida: la tabla crece con los días.
  const limpios = Array.from(new Set(nombres.map((n) => (n || '').trim()).filter((n) => n.length >= 3))).slice(0, 200)
  if (!limpios.length) return 0
  const { data: vistos } = await sb.from('empresas_vistas').select('nombre').in('nombre', limpios)
  const yaVistos = new Set((vistos ?? []).map((r: { nombre: string }) => r.nombre))
  const nuevos = limpios.filter((n) => !yaVistos.has(n)).slice(0, limite)
  if (!nuevos.length) return 0

  let altas = 0
  const tareas = nuevos.map((nombre) => async () => {
    for (const slug of slugsDe(nombre).slice(0, 2)) { // solo los 2 slugs más probables
      for (const ats of ATS_LIST) {
        if (await existeEnAts(ats, slug)) { await altaEmpresa(sb, { nombre, ats, token: slug, origen: 'sondeo' }); altas++; return }
      }
    }
  })
  await enLotes(tareas, 6)
  // marca todos como sondeados (aunque no encuentren) para no repetir
  await sb.from('empresas_vistas').upsert(nuevos.map((nombre) => ({ nombre, sondeada_en: new Date().toISOString() })), { onConflict: 'nombre' })
  return altas
}

// Helper por si algún día se agrega una empresa a mano desde una URL.
export function detectarEmpresaDesdeUrl(url: string): { ats: string; token: string } | null {
  const d = detectarAts(url)
  if (d.ats && d.ats_token) return { ats: d.ats, token: d.ats_token }
  const gh = url.match(/greenhouse\.io\/([^/?#]+)/); if (gh) return { ats: 'greenhouse', token: gh[1] }
  const lv = url.match(/jobs\.lever\.co\/([^/?#]+)/); if (lv) return { ats: 'lever', token: lv[1] }
  const ab = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/); if (ab) return { ats: 'ashby', token: ab[1] }
  return null
}
