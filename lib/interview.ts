// Helpers server-side del módulo de preentrevistas. Todo entra por API routes con
// la service key (RLS encendido sin políticas → sólo service_role lee/escribe).
import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from './supabaseAdmin'

export const DEFAULT_SLUG = 'campo-operacion'
export const AUDIO_BUCKET = 'interview-audio'

export type QuickField = { key: string; label: string; type: 'number' | 'text' | 'select'; options?: string[]; required?: boolean; knockout?: string[] }
export type Question = { order: number; text: string; maxSeconds: number; rubric: Record<string, string> }
export type Template = { id: string; title: string; slug: string; intro: string | null; quick_fields: QuickField[]; questions: Question[]; thresholds: { call: number; review: number } }
export type Invite = {
  id: string; template_id: string; candidate_name: string; candidate_phone: string | null; token: string
  status: 'pending' | 'in_progress' | 'completed' | 'discarded' | 'call_scheduled'
  quick_answers: Record<string, string>; consent_at: string | null; invited_at: string; completed_at: string | null
  first_opened_at?: string | null; reminded_at?: string | null; analysis?: unknown
}
export type SpeechMetrics = { durationSec: number; pctMax: number | null; words: number; wpm: number; fillersPerMin: number; fillersTotal: number; fillerCounts: Record<string, number>; initialPauseSec: number; longPauses: number }
export type Answer = { id: string; invite_id: string; question_order: number; audio_path: string | null; mime_type: string | null; duration_sec: number | null; transcript: string | null; created_at: string; retakes?: number; metrics?: SpeechMetrics | null }
export type Score = { id: string; invite_id: string; question_order: number; score: number | null; note: string | null }

export function randToken(): string {
  return randomBytes(18).toString('base64url') // ~24 chars, no adivinable
}

// Contraseña del panel de RH: reusa la del admin (x-admin-password), lo más simple.
export function checkRh(req: Request): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()
  const got = (req.headers.get('x-admin-password') ?? '').trim()
  return !!expected && got === expected
}

function normTemplate(data: unknown): Template | null {
  if (!data) return null
  const t = data as Template
  t.questions = (t.questions || []).slice().sort((a, b) => a.order - b.order)
  return t
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const sb = getSupabaseAdmin(); if (!sb) return null
  const { data } = await sb.from('interview_templates').select('*').eq('id', id).maybeSingle()
  return normTemplate(data)
}

export async function getTemplateBySlug(slug: string): Promise<Template | null> {
  const sb = getSupabaseAdmin(); if (!sb) return null
  const { data } = await sb.from('interview_templates').select('*').eq('slug', slug).maybeSingle()
  return normTemplate(data)
}

// Plantilla por defecto para invitaciones creadas desde el panel (base de campo).
export async function getTemplate(): Promise<Template | null> {
  return (await getTemplateBySlug(DEFAULT_SLUG)) || (await getTemplateBySlug('ventas-comision'))
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const { data } = await sb.from('interview_invites').select('*').eq('token', token).maybeSingle()
  return (data as Invite) || null
}

// Etiqueta automática según el puntaje total y los thresholds de la plantilla.
export function labelFor(total: number, th: { call: number; review: number }): 'call' | 'review' | 'discard' {
  if (total >= th.call) return 'call'
  if (total >= th.review) return 'review'
  return 'discard'
}

// ¿Algún dato rápido cayó en un valor knockout?
export function knockoutHits(fields: QuickField[], answers: Record<string, string>): string[] {
  const hits: string[] = []
  for (const f of fields) {
    const v = answers[f.key]
    if (v != null && f.knockout && f.knockout.includes(String(v))) hits.push(f.label)
  }
  return hits
}
