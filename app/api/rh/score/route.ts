import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Guarda la calificación (1–3) y/o nota de una pregunta de un candidato.
export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const body = await req.json().catch(() => null)
  const inviteId = String(body?.inviteId ?? '')
  const order = Number(body?.order)
  const score = body?.score == null ? null : Math.min(3, Math.max(1, Math.round(Number(body.score))))
  const note = body?.note == null ? undefined : String(body.note)
  if (!inviteId || !Number.isInteger(order)) return NextResponse.json({ ok: false, error: 'faltan datos' }, { status: 400 })
  const row: Record<string, unknown> = { invite_id: inviteId, question_order: order }
  if (score !== undefined) row.score = score
  if (note !== undefined) row.note = note
  const { error } = await sb.from('interview_scores').upsert(row, { onConflict: 'invite_id,question_order' })
  if (error) return NextResponse.json({ ok: false, error: 'no se pudo guardar' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
