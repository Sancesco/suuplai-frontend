import { aiRawJSON, parseJSON } from './ai'

export type Investigacion = {
  gancho: string; cita: string; confianza: 'alta' | 'media' | 'baja'; afirma_cifra: boolean
  angulo: string; sector: string; asunto_sugerido: string; evidencia_url: string | null; auto_enviable: boolean
}

const ANGULOS = ['ventas_frio', 'implementacion', 'banca', 'construccion_producto', 'canal_tiendas']

// Deriva el dominio de la empresa: del sitio, del correo o del nombre.
export function dominioDe(p: { sitio_web?: string | null; email?: string | null; empresa?: string }): string | null {
  const limpia = (s: string) => s.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0].trim()
  if (p.sitio_web && /\./.test(p.sitio_web)) return limpia(p.sitio_web)
  if (p.email && p.email.includes('@')) {
    const d = p.email.split('@')[1]
    if (d && !/(gmail|hotmail|outlook|yahoo|icloud|proton)\./i.test(d)) return limpia(d)
  }
  return null
}

// Baja el HTML del sitio y lo convierte a texto plano (acotado).
async function leerSitio(dominio: string): Promise<{ texto: string; url: string } | null> {
  const url = `https://${dominio}`
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000)
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SuuplaiBot/1.0)' }, signal: ctrl.signal, redirect: 'follow' })
    clearTimeout(t)
    if (!r.ok) return null
    const html = await r.text()
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim()
    return { texto: texto.slice(0, 5000), url: r.url || url }
  } catch { return null }
}

const SYSTEM = `Eres el investigador de un sistema de correos en frío para la búsqueda de trabajo de Santiago (fundador: vende en frío, construye software/IA él mismo, implementa en operaciones de empresas). Lees el SITIO de una empresa y produces UNA sola línea de "gancho" que conecte el perfil de Santiago con algo REAL y verificable de esa empresa.
REGLAS DURAS:
- Usa SOLO lo que está en el TEXTO del sitio. NUNCA inventes ni infles un número, año, ronda de inversión ni tecnología. Si no está en el texto, no existe.
- Si no hay nada específico y verificable, devuelve confianza "baja" y un gancho corto y genérico. Eso es correcto, no una falla.
- Voz de Santiago: directa, sin adjetivos de relaciones públicas, SIN "me emociona" ni "me apasiona". Una sola frase, máx 25 palabras.
- Marca afirma_cifra=true si el gancho menciona CUALQUIER número, fecha o ronda de inversión.
Devuelve SOLO JSON: {"gancho":"...","cita":"frase literal del sitio que lo respalda o ''","confianza":"alta|media|baja","afirma_cifra":true|false,"angulo":"ventas_frio|implementacion|banca|construccion_producto|canal_tiendas","sector":"una palabra","asunto_sugerido":"asunto corto alternativo o ''"}`

export async function investigar(p: { empresa: string; puesto?: string | null; sitio_web?: string | null; email?: string | null }): Promise<Investigacion> {
  const dom = dominioDe(p)
  const sitio = dom ? await leerSitio(dom) : null
  const user = `EMPRESA: ${p.empresa}\nPUESTO del destinatario: ${p.puesto || '—'}\nSITIO (${dom || 'sin dominio'}):\n${sitio?.texto || '(no se pudo leer el sitio)'}`
  const raw = await aiRawJSON(SYSTEM, user, 0.3, 500)
  const j = parseJSON(raw) as Partial<Investigacion>
  const confianza = (['alta', 'media', 'baja'].includes(String(j.confianza)) ? j.confianza : 'baja') as Investigacion['confianza']
  const afirma = j.afirma_cifra === true
  return {
    gancho: String(j.gancho ?? '').trim(),
    cita: String(j.cita ?? '').trim(),
    confianza, afirma_cifra: afirma,
    angulo: ANGULOS.includes(String(j.angulo)) ? String(j.angulo) : 'ventas_frio',
    sector: String(j.sector ?? '').trim(),
    asunto_sugerido: String(j.asunto_sugerido ?? '').trim(),
    evidencia_url: sitio?.url ?? (dom ? `https://${dom}` : null),
    // Compuerta: sale solo únicamente si es alta confianza y NO afirma una cifra.
    auto_enviable: confianza === 'alta' && !afirma,
  }
}
