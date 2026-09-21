import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh, getTemplate, knockoutHits, labelFor, AUDIO_BUCKET, type Invite, type Answer, type Score } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES = ['pending', 'in_progress', 'completed', 'discarded', 'call_scheduled']

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); const template = await getTemplate()
  if (!sb || !template) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: invRow } = await sb.from('interview_invites').select('*').eq('id', params.id).maybeSingle()
  const invite = invRow as Invite | null
  if (!invite) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  const { data: ansRows } = await sb.from('interview_answers').select('*').eq('invite_id', invite.id)
  const { data: scoreRows } = await sb.from('interview_scores').select('*').eq('invite_id', invite.id)
  const answers = new Map((ansRows as Answer[] ?? []).map((a) => [a.question_order, a]))
  const scores = new Map((scoreRows as Score[] ?? []).map((s) => [s.question_order, s]))

  const questions = await Promise.all(template.questions.map(async (q) => {
    const a = answers.get(q.order); const s = scores.get(q.order)
    let audioUrl: string | null = null
    if (a?.audio_path) { const { data } = await sb.storage.from(AUDIO_BUCKET).createSignedUrl(a.audio_path, 3600); audioUrl = data?.signedUrl ?? null }
    return { order: q.order, text: q.text, rubric: q.rubric, audioUrl, duration: a?.duration_sec ?? null, score: s?.score ?? null, note: s?.note ?? '' }
  }))

  const scoredArr = template.questions.map((q) => scores.get(q.order)?.score).filter((x): x is number => x != null)
  const total = scoredArr.reduce((a, b) => a + b, 0)
  const fullyScored = scoredArr.length === template.questions.length
  const quick = template.quick_fields.map((f) => ({ label: f.label, value: invite.quick_answers?.[f.key] ?? '', knockout: !!(f.knockout && f.knockout.includes(String(invite.quick_answers?.[f.key] ?? ''))) }))

  return NextResponse.json({
    ok: true,
    invite: { id: invite.id, name: invite.candidate_name, phone: invite.candidate_phone, status: invite.status, invited_at: invite.invited_at, completed_at: invite.completed_at },
    quick, questions,
    total, maxTotal: template.questions.length * 3, fullyScored,
    label: fullyScored ? labelFor(total, template.thresholds) : null,
    thresholds: template.thresholds,
    knockout: knockoutHits(template.quick_fields, invite.quick_answers || {}),
  })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const body = await req.json().catch(() => null)
  const status = String(body?.status ?? '')
  if (!STATUSES.includes(status)) return NextResponse.json({ ok: false, error: 'estado inválido' }, { status: 400 })
  await sb.from('interview_invites').update({ status }).eq('id', params.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  // borra audios del bucket
  const { data: files } = await sb.storage.from(AUDIO_BUCKET).list(params.id)
  if (files && files.length) await sb.storage.from(AUDIO_BUCKET).remove(files.map((f) => `${params.id}/${f.name}`))
  await sb.from('interview_invites').delete().eq('id', params.id) // cascade borra answers/scores
  return NextResponse.json({ ok: true })
}
