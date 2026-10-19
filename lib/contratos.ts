// Helpers server-side del módulo de firma de contratos. Todo entra por API routes con
// la service key (RLS encendido sin políticas → sólo service_role lee/escribe). El enlace
// de firma se valida por token en el servidor, no con RLS por cliente.
import { createHash } from 'crypto'
import { getSupabaseAdmin } from './supabaseAdmin'
import { checkRh as checkAdmin, randToken } from './interview' // misma contraseña de admin (x-admin-password)

export { getSupabaseAdmin, checkAdmin, randToken }

export type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

export const SOURCE_BUCKET = 'contract-source'   // PDF original subido
export const SIGN_BUCKET = 'contract-signatures' // PNG de cada firma
export const PDF_BUCKET = 'contract-pdfs'        // PDF final firmado
export const LINK_TTL_DIAS = 30 // el enlace de firma expira a los 30 días

export type ContractStatus = 'draft' | 'sent' | 'partially_signed' | 'completed' | 'voided'

export type Contract = {
  id: string; title: string; content: string | null; content_hash: string
  source_pdf: string | null // ruta del PDF original en SOURCE_BUCKET
  status: ContractStatus; created_at: string; completed_at: string | null; pdf_url: string | null
}

export type Signer = {
  id: string; contract_id: string; full_name: string; email: string; role: string | null
  token: string; sign_order: number; signed_at: string | null; signature_image: string | null
  ip: string | null; user_agent: string | null; created_at: string
}

export type ContractEvent = {
  id: string; contract_id: string; signer_id: string | null; event_type: string
  payload: Record<string, unknown> | null; created_at: string
}

// Hash del documento que se firma. Se calcula al crear y se vuelve a verificar antes de
// cada firma: si el documento cambió, la firma se bloquea.
export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}
export function hashBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

// Compara el nombre tecleado contra el del firmante: trim + espacios colapsados + sin
// distinguir mayúsculas/acentos, para no frustrar por un espacio de más.
export function nombreCoincide(tecleado: string, esperado: string): boolean {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
  return !!tecleado && norm(tecleado) === norm(esperado)
}

export async function logEvent(
  sb: SB, contractId: string, eventType: string,
  opts: { signerId?: string | null; payload?: Record<string, unknown> } = {},
): Promise<void> {
  await sb.from('contract_events').insert({
    contract_id: contractId, signer_id: opts.signerId ?? null,
    event_type: eventType, payload: opts.payload ?? {},
  })
}

export async function getContractById(sb: SB, id: string): Promise<Contract | null> {
  const { data } = await sb.from('contracts').select('*').eq('id', id).maybeSingle()
  return (data as Contract) || null
}

export async function getSignersByContract(sb: SB, contractId: string): Promise<Signer[]> {
  const { data } = await sb.from('signers').select('*').eq('contract_id', contractId).order('sign_order', { ascending: true })
  return (data ?? []) as Signer[]
}

export async function getSignerByToken(sb: SB, token: string): Promise<Signer | null> {
  const { data } = await sb.from('signers').select('*').eq('token', token).maybeSingle()
  return (data as Signer) || null
}

// ¿El enlace de firma ya expiró? (se cuenta desde la creación del contrato)
export function enlaceExpirado(c: Contract): boolean {
  const ms = Date.now() - new Date(c.created_at).getTime()
  return ms > LINK_TTL_DIAS * 24 * 3600 * 1000
}

// Genera un token único no usado en signers.
export async function tokenUnico(sb: SB): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const t = randToken()
    const { data } = await sb.from('signers').select('id').eq('token', t).maybeSingle()
    if (!data) return t
  }
  return randToken() + randToken()
}

// IP del cliente a partir de los headers (Vercel usa x-forwarded-for).
export function ipDeReq(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || null
}
