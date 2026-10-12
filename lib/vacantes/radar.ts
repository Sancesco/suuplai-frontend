import crypto from 'crypto'

// Radar de vacantes: agregadores (Jooble/Adzuna) + helpers de ranking/ATS. Los lectores de ATS y el
// descubrimiento viven en ats.ts / descubrir.ts; el orquestador en correr.ts. No automatiza portales.

export type Vacante = {
  titulo: string; empresa: string; ubicacion: string; descripcion: string
  sueldo: string; link: string; fecha_publicada: string | null; fuente: string
  ats?: string | null; ats_token?: string | null; ats_job_id?: string | null
  clave?: string; puntaje?: number; ingles?: boolean
}

export const BUSQUEDAS = [
  'Account Executive', 'Key Account Manager', 'Sales Engineer', 'Solutions Consultant',
  'Business Development Manager', 'Partnerships Manager', 'Head of Sales', 'Sales Manager',
  'Ejecutivo de cuentas', 'Ejecutivo de cuentas clave', 'Gerente de cuentas clave',
  'Ejecutivo comercial B2B', 'Ejecutivo de nuevos negocios', 'Ejecutivo de ventas corporativas',
  'Gerente de ventas', 'Gerente comercial', 'Jefe de ventas', 'Director comercial',
  'Gerente de desarrollo de negocios', 'Desarrollo de negocios', 'Gerente de alianzas',
  'Consultor de soluciones', 'Ingeniero de preventa', 'Preventa',
  'Gerente de operaciones comerciales', 'Chief of Staff', 'Revenue Operations', 'Sales Operations',
  'Deployment Strategist', 'Forward Deployed', 'Implementation Manager', 'Solutions Engineer',
]
// OJO: Jooble devuelve 0 si la ubicación lleva acento ("México"). Va SIN acento ("Mexico").
// Una sola ubicación para ahorrar llamadas (Jooble free ~500/día); pasa() filtra CDMX/remoto/LATAM.
const UBICACIONES = ['Mexico']

export const CDMX = ['ciudad de méxico', 'ciudad de mexico', 'cdmx', 'mexico city', 'remoto', 'remote', 'home office', 'latam', 'latin america']
const OTRAS = ['guadalajara', 'monterrey', 'zapopan', 'querétaro', 'queretaro', 'puebla', 'león', 'mérida',
  'merida', 'tijuana', 'aguascalientes', 'mexicali', 'cancún', 'cancun', 'saltillo', 'chihuahua',
  'hermosillo', 'toluca', 'san luis potosí', 'veracruz', 'morelia', 'culiacán']
const EXCLUIR = ['sdr', 'bdr', 'sales development representative', 'business development representative',
  'trainee', 'becario', 'practicante', 'intern', 'junior', 'jr.', ' jr ', 'asesor de ventas',
  'vendedor comisionista', 'promotor', 'call center', 'telemarketing', 'cajero', 'piso de venta']
// El puesto debe matchear el PERFIL de Santiago (comercial B2B + implementación IA + fintech +
// chief of staff/ops). Si el título no tiene ninguna de estas señales, se descarta.
const SENAL_VENTAS = /account (executive|manager|director)|key account|\bsales\b|\bventas?\b|comercial|business development|desarrollo de negocios|partnership|alianzas|ejecutivo de (cuentas|ventas)|cuentas? clave|solutions? (consultant|engineer|architect)|consultor de soluciones|pre-?vent|pre-?sales|sales engineer|revenue|go-?to-?market|customer success|gerente comercial|gerente de ventas|director comercial|jefe de ventas|deployment strategist|forward deployed|implementation (manager|consultant|specialist|lead)|chief of staff|business operations|sales operations|revenue operations|rev ?ops|biz ?ops|operaciones comerciales|estrategia (comercial|y operaciones)|strategy (and|&) operations|onboarding (manager|lead)/i
// "Alcanzable": fuera lo demasiado senior/corporativo (no realista para su nivel actual).
const EXCLUIR_SENIOR = /\b(vp|svp|evp|avp)\b|vice ?president|senior director|sr\.? director|managing director|director general|regional director|chief (revenue|executive|operating|financial|technology|commercial|product|marketing|growth) officer|\bc[efotm]o\b|head of (country|latam|mexico)/i
// Títulos de ingeniería/TI/soporte que nunca queremos (refuerzo del filtro por señal de ventas).
const EXCLUIR_TITULO = /software (engineer|developer|development)|developer|programad|\bjava\b|python|\.net|front-?end|back-?end|full-?stack|devops|\bsre\b|site reliability|infrastructure|cloud (engineer|architect|migration|platform)|platform engineer|\bqa\b|data (engineer|analytics|scientist)|anal[ií]sta de datos|machine learning|security engineer|\bl[12]\b|support specialist|soporte|helpdesk/i
const INGLES = ['english', 'inglés avanzado', 'ingles avanzado', 'bilingual', 'bilingüe', 'us market', 'north america']
const PESOS: [RegExp, number][] = [
  [/\b(ia|ai|inteligencia artificial|genai|llm|agentes?)\b/, 4],
  [/whatsapp|conversacional|chatbot|business messaging/, 4],
  [/fintech|pagos|payments|cr[eé]dito|lending|cobranza|banca|neobank/, 3],
  [/saas|software|plataforma|tecnolog[ií]a|cloud/, 2],
  [/startup|serie [abc]|series [abc]|scale-?up/, 2],
  [/b2b|pymes|smb|mid-?market|enterprise/, 2],
  [/account executive|sales engineer|solutions (consultant|engineer)|preventa|key account|deployment|forward deployed/, 2],
  [/ejecutivo de cuentas|cuentas clave|consultor de soluciones|ingeniero de preventa|nuevos negocios/, 2],
  [/head of|gerente|manager|lead|l[ií]der|director|jefe/, 1],
]

export const low = (s?: string) => (s || '').toLowerCase()
export const deEntidades = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
export const strip = (s?: string) => deEntidades((s || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

// Ejecuta tareas con máximo N en paralelo (evita rate limits y timeouts en Vercel).
export async function enLotes<T>(tareas: (() => Promise<T>)[], n = 6): Promise<T[]> {
  const out: T[] = []; let i = 0
  await Promise.all(Array.from({ length: Math.min(n, tareas.length) }, async () => {
    while (i < tareas.length) { const k = i++; try { out[k] = await tareas[k]() } catch { /* se ignora el fallo individual */ } }
  }))
  return out
}

// Si el link apunta a un ATS conocido, saca token e id (para jalar preguntas / dar de alta la empresa).
export function detectarAts(link: string): Pick<Vacante, 'ats' | 'ats_token' | 'ats_job_id'> {
  const gh = link.match(/(?:boards|job-boards)\.greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/)
  if (gh) return { ats: 'greenhouse', ats_token: gh[1], ats_job_id: gh[2] }
  const ghFor = link.match(/gh_jid=(\d+)/)
  if (ghFor) return { ats: 'greenhouse', ats_token: null, ats_job_id: ghFor[1] }
  const lv = link.match(/jobs\.lever\.co\/([^/?#]+)\/([0-9a-f-]{36})/)
  if (lv) return { ats: 'lever', ats_token: lv[1], ats_job_id: lv[2] }
  const ab = link.match(/jobs\.ashbyhq\.com\/([^/?#]+)\/([0-9a-f-]{36})/)
  if (ab) return { ats: 'ashby', ats_token: ab[1], ats_job_id: ab[2] }
  return { ats: null, ats_token: null, ats_job_id: null }
}

type JoobleJob = { title?: string; company?: string; location?: string; snippet?: string; salary?: string; link?: string; updated?: string; source?: string }
async function jooble(q: string, loc: string): Promise<Vacante[]> {
  const key = process.env.JOOBLE_KEY; if (!key) return []
  const r = await fetch(`https://jooble.org/api/${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: q, location: loc }) })
  if (!r.ok) return []
  const d = (await r.json()) as { jobs?: JoobleJob[] }
  return (d.jobs || []).map((j): Vacante => ({
    titulo: j.title || '', empresa: j.company || '', ubicacion: j.location || '',
    descripcion: strip(j.snippet), sueldo: j.salary || '', link: j.link || '',
    fecha_publicada: (j.updated || '').slice(0, 10) || null, fuente: 'Jooble' + (j.source ? ` / ${j.source}` : ''),
  }))
}

type AdzunaJob = { title?: string; company?: { display_name?: string }; location?: { display_name?: string }; description?: string; salary_min?: number; salary_max?: number; redirect_url?: string; created?: string }
async function adzuna(q: string, loc: string, dias = 7): Promise<Vacante[]> {
  const id = process.env.ADZUNA_APP_ID, key = process.env.ADZUNA_APP_KEY
  if (!id || !key) return []
  const p = new URLSearchParams({ app_id: id, app_key: key, what: q, where: loc, results_per_page: '50', max_days_old: String(dias) })
  const r = await fetch(`https://api.adzuna.com/v1/api/jobs/mx/search/1?${p}`)
  if (!r.ok) return []
  const d = (await r.json()) as { results?: AdzunaJob[] }
  return (d.results || []).map((j): Vacante => ({
    titulo: j.title || '', empresa: j.company?.display_name || '', ubicacion: j.location?.display_name || '',
    descripcion: strip(j.description), sueldo: j.salary_min ? `${Math.round(j.salary_min)}–${Math.round(j.salary_max || j.salary_min)}` : '',
    link: j.redirect_url || '', fecha_publicada: (j.created || '').slice(0, 10) || null, fuente: 'Adzuna',
  }))
}

export function pasa(v: Vacante): boolean {
  const u = low(v.ubicacion), titulo = low(v.titulo), t = ` ${titulo} `
  const enCdmx = CDMX.some((k) => u.includes(k))
  if (u && OTRAS.some((c) => u.includes(c)) && !enCdmx) return false
  if (u && !enCdmx && !u.includes('méxico') && !u.includes('mexico')) return false
  if (EXCLUIR.some((x) => t.includes(x))) return false
  if (EXCLUIR_TITULO.test(titulo)) return false       // fuera ingeniería/TI/soporte
  if (EXCLUIR_SENIOR.test(titulo)) return false        // fuera lo demasiado senior (no alcanzable)
  if (!SENAL_VENTAS.test(titulo)) return false         // el puesto debe matchear el perfil
  return true
}

export function claveDe(v: Vacante): string {
  return crypto.createHash('md5').update(low(v.titulo + v.empresa).replace(/\W+/g, '')).digest('hex').slice(0, 16)
}

// Señales de que el puesto está en español (vocabulario comercial en español o acentos).
const ESPANOL = /[áéíóúñ]|ejecutivo|gerente|ventas|comercial|cuentas|desarrollo de negocios|preventa|\bjefe\b|l[ií]der|alianzas|consultor de soluciones/i
export function rankear(v: Vacante, bonoEmpresaObjetivo = 0): Vacante {
  const txt = low(`${v.titulo} ${v.empresa} ${v.descripcion}`)
  let p = PESOS.reduce((s, [re, w]) => s + (re.test(txt) ? w : 0), 0) + bonoEmpresaObjetivo
  const espanol = ESPANOL.test(`${v.titulo} ${v.descripcion}`)
  const requiereIngles = INGLES.some((s) => txt.includes(s))
  if (espanol) p += 3                 // preferimos español
  if (requiereIngles) p -= 3
  const ingles = !espanol || requiereIngles  // marca 🇬🇧 lo que NO es español (para ocultarlo)
  const ats = v.ats ? { ats: v.ats, ats_token: v.ats_token, ats_job_id: v.ats_job_id } : detectarAts(v.link)
  return { ...v, ...ats, puntaje: p, ingles, clave: claveDe(v) }
}

export const HAY_LLAVES = () => !!(process.env.JOOBLE_KEY || (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY))

// Datos de ejemplo para la UI sin ninguna llave (Jooble/Adzuna). Los ATS traen datos reales sin llave.
export const EJEMPLOS: Vacante[] = [
  { titulo: 'Account Executive', empresa: 'Yalo', ubicacion: 'Ciudad de México (Remoto)', descripcion: 'Venta B2B de una plataforma de IA conversacional sobre WhatsApp para enterprise.', sueldo: '45000–60000', link: 'https://ejemplo.com/ae-yalo', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Key Account Manager', empresa: 'Clip', ubicacion: 'Ciudad de México', descripcion: 'Fintech de pagos. Cuentas clave, upsell y relación con comercios B2B.', sueldo: '40000–55000', link: 'https://ejemplo.com/kam-clip', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Solutions Consultant', empresa: 'Kueski', ubicacion: 'México (Híbrido)', descripcion: 'Lending/BNPL. Preventa consultiva de una plataforma SaaS fintech a comercios.', sueldo: '', link: 'https://ejemplo.com/sc-kueski', fecha_publicada: null, fuente: 'ejemplo' },
]

// Corre solo los agregadores (Jooble + Adzuna) con concurrencia limitada.
export async function correrAgregadores(): Promise<Vacante[]> {
  if (!HAY_LLAVES()) return EJEMPLOS
  const tareas = BUSQUEDAS.flatMap((q) => UBICACIONES.flatMap((loc) => [() => jooble(q, loc), () => adzuna(q, loc)]))
  const res = await enLotes(tareas, 6)
  return res.flat()
}
