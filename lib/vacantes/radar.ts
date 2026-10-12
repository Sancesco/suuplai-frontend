import crypto from 'crypto'

// Radar de vacantes: consulta SOLO APIs oficiales de búsqueda (Jooble / Adzuna), filtra a CDMX y
// puestos de mi nivel, y rankea por afinidad (IA, fintech, SaaS, B2B). No automatiza portales ni
// envía nada. Si no hay llaves configuradas, devuelve datos de ejemplo para ver la UI.

export type Vacante = {
  titulo: string; empresa: string; ubicacion: string; descripcion: string
  sueldo: string; link: string; fecha_publicada: string | null; fuente: string
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
  'Strategy Operations', 'Business Operations', 'Estrategia y operaciones',
  'Gerente de operaciones comerciales', 'Chief of Staff',
]
const UBICACIONES = ['Ciudad de México', 'México']

const CDMX = ['ciudad de méxico', 'ciudad de mexico', 'cdmx', 'mexico city', 'remoto', 'remote', 'home office']
const OTRAS = ['guadalajara', 'monterrey', 'zapopan', 'querétaro', 'queretaro', 'puebla', 'león', 'mérida',
  'merida', 'tijuana', 'aguascalientes', 'mexicali', 'cancún', 'cancun', 'saltillo', 'chihuahua',
  'hermosillo', 'toluca', 'san luis potosí', 'veracruz', 'morelia', 'culiacán']
const EXCLUIR = ['sdr', 'bdr', 'sales development representative', 'business development representative',
  'trainee', 'becario', 'practicante', 'intern', 'junior', 'jr.', ' jr ', 'asesor de ventas',
  'vendedor comisionista', 'promotor', 'call center', 'telemarketing', 'cajero', 'piso de venta']
const INGLES = ['english', 'inglés avanzado', 'ingles avanzado', 'bilingual', 'bilingüe', 'us market', 'north america']
const PESOS: [RegExp, number][] = [
  [/\b(ia|ai|inteligencia artificial|genai|llm|agentes?)\b/, 4],
  [/whatsapp|conversacional|chatbot|business messaging/, 4],
  [/fintech|pagos|payments|cr[eé]dito|lending|cobranza|banca|neobank/, 3],
  [/saas|software|plataforma|tecnolog[ií]a|cloud/, 2],
  [/startup|serie [abc]|series [abc]|scale-?up/, 2],
  [/b2b|pymes|smb|mid-?market|enterprise/, 2],
  [/account executive|sales engineer|solutions consultant|preventa|key account/, 2],
  [/ejecutivo de cuentas|cuentas clave|consultor de soluciones|ingeniero de preventa|nuevos negocios/, 2],
  [/head of|gerente|manager|lead|l[ií]der|director|jefe/, 1],
]

const low = (s?: string) => (s || '').toLowerCase()
const strip = (s?: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

type JoobleJob = { title?: string; company?: string; location?: string; snippet?: string; salary?: string; link?: string; updated?: string; source?: string }
async function jooble(q: string, loc: string): Promise<Vacante[]> {
  const key = process.env.JOOBLE_KEY; if (!key) return []
  const r = await fetch(`https://jooble.org/api/${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: q, location: loc }),
  })
  if (!r.ok) return []
  const d = (await r.json()) as { jobs?: JoobleJob[] }
  return (d.jobs || []).map((j): Vacante => ({
    titulo: j.title || '', empresa: j.company || '', ubicacion: j.location || '',
    descripcion: strip(j.snippet), sueldo: j.salary || '', link: j.link || '',
    fecha_publicada: (j.updated || '').slice(0, 10) || null,
    fuente: 'Jooble' + (j.source ? ` / ${j.source}` : ''),
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
    titulo: j.title || '', empresa: j.company?.display_name || '',
    ubicacion: j.location?.display_name || '', descripcion: strip(j.description),
    sueldo: j.salary_min ? `${Math.round(j.salary_min)}–${Math.round(j.salary_max || j.salary_min)}` : '',
    link: j.redirect_url || '', fecha_publicada: (j.created || '').slice(0, 10) || null, fuente: 'Adzuna',
  }))
}

function pasa(v: Vacante): boolean {
  const u = low(v.ubicacion), t = ` ${low(v.titulo)} `
  const enCdmx = CDMX.some((k) => u.includes(k))
  if (u && OTRAS.some((c) => u.includes(c)) && !enCdmx) return false
  if (u && !enCdmx && !u.includes('méxico') && !u.includes('mexico')) return false
  return !EXCLUIR.some((x) => t.includes(x))
}

function claveDe(v: Vacante): string {
  return crypto.createHash('md5').update(low(v.titulo + v.empresa).replace(/\W+/g, '')).digest('hex').slice(0, 16)
}

function rankear(v: Vacante): Vacante {
  const txt = low(`${v.titulo} ${v.empresa} ${v.descripcion}`)
  let p = PESOS.reduce((s, [re, w]) => s + (re.test(txt) ? w : 0), 0)
  const ingles = INGLES.some((s) => txt.includes(s))
  if (ingles) p -= 3
  return { ...v, puntaje: p, ingles, clave: claveDe(v) }
}

export const HAY_LLAVES = () => !!(process.env.JOOBLE_KEY || (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY))

// Datos de ejemplo para desarrollar/probar la UI sin llaves. Marcados con fuente "ejemplo".
const EJEMPLOS: Vacante[] = [
  { titulo: 'Account Executive', empresa: 'Yalo', ubicacion: 'Ciudad de México (Remoto)', descripcion: 'Venta B2B de una plataforma de IA conversacional sobre WhatsApp para enterprise. Prospección y cierre de cuentas mid-market.', sueldo: '45000–60000', link: 'https://ejemplo.com/ae-yalo', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Key Account Manager', empresa: 'Clip', ubicacion: 'Ciudad de México', descripcion: 'Fintech de pagos. Manejo de cuentas clave, upsell y relación con comercios B2B.', sueldo: '40000–55000', link: 'https://ejemplo.com/kam-clip', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Solutions Consultant', empresa: 'Kueski', ubicacion: 'México (Híbrido)', descripcion: 'Lending/BNPL. Preventa consultiva de una plataforma SaaS fintech a comercios.', sueldo: '', link: 'https://ejemplo.com/sc-kueski', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Business Development Manager', empresa: 'Truora', ubicacion: 'Ciudad de México (Remoto)', descripcion: 'Startup de verificación de identidad y WhatsApp business messaging. Nuevos negocios B2B en LATAM.', sueldo: '', link: 'https://ejemplo.com/bdm-truora', fecha_publicada: null, fuente: 'ejemplo' },
  { titulo: 'Gerente de Ventas', empresa: 'Bind ERP', ubicacion: 'Ciudad de México', descripcion: 'SaaS de software administrativo para pymes. Liderar equipo comercial B2B.', sueldo: '', link: 'https://ejemplo.com/gv-bind', fecha_publicada: null, fuente: 'ejemplo' },
]

// Corre el radar completo. Si no hay llaves, usa EJEMPLOS para que la pantalla no quede vacía.
export async function correrRadar(minPuntaje = 3): Promise<Vacante[]> {
  const todas: Vacante[] = []
  if (!HAY_LLAVES()) {
    todas.push(...EJEMPLOS)
  } else {
    for (const q of BUSQUEDAS) for (const loc of UBICACIONES) {
      const [a, b] = await Promise.all([jooble(q, loc).catch(() => []), adzuna(q, loc).catch(() => [])])
      todas.push(...a, ...b)
    }
  }
  const unicas = new Map<string, Vacante>()
  for (const v of todas) {
    if (!pasa(v)) continue
    const r = rankear(v)
    if (!unicas.has(r.clave!)) unicas.set(r.clave!, r)
  }
  return Array.from(unicas.values()).filter((v) => (v.puntaje || 0) >= minPuntaje).sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0))
}
