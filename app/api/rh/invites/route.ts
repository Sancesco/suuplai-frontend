import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh, getTemplate, knockoutHits, labelFor, randToken, type Invite } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); const template = await getTemplate()
  if (!sb || !template) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  const { data: invRows } = await sb.from('interview_invites').select('*').eq('template_id', template.id).order('invited_at', { ascending: false })
  const invites = (invRows ?? []) as Invite[]
  const ids = invites.map((i) => i.id)
  const scoreByInvite = new Map<string, number>()
  const scoredCount = new Map<string, number>()
  const answeredCount = new Map<string, number>()
  if (ids.length) {
    const { data: sc } = await sb.from('interview_scores').select('invite_id,score').in('invite_id', ids)
    for (const r of (sc ?? []) as { invite_id: string; score: number | null }[]) {
      if (r.score != null) { scoreByInvite.set(r.invite_id, (scoreByInvite.get(r.invite_id) || 0) + r.score); scoredCount.set(r.invite_id, (scoredCount.get(r.invite_id) || 0) + 1) }
    }
    const { data: an } = await sb.from('interview_answers').select('invite_id').in('invite_id', ids)
    for (const r of (an ?? []) as { invite_id: string }[]) answeredCount.set(r.invite_id, (answeredCount.get(r.invite_id) || 0) + 1)
  }
  const maxTotal = template.questions.length * 3
  const now = Date.now()

  const list = invites.map((i) => {
    const total = scoreByInvite.get(i.id) || 0
    const scored = scoredCount.get(i.id) || 0
    const ko = knockoutHits(template.quick_fields, i.quick_answers || {})
    const stale = i.status !== 'completed' && i.status !== 'discarded' && i.status !== 'call_scheduled' && now - new Date(i.invited_at).getTime() > 3 * 86400000
    return {
      id: i.id, name: i.candidate_name, phone: i.candidate_phone, status: i.status,
      invited_at: i.invited_at, completed_at: i.completed_at,
      answered: answeredCount.get(i.id) || 0, scored, total, maxTotal,
      label: scored === template.questions.length ? labelFor(total, template.thresholds) : null,
      knockout: ko, stale,
    }
  })
  return NextResponse.json({ ok: true, template: { title: template.title, questions: template.questions.length, thresholds: template.thresholds }, invites: list })
}

export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); const template = await getTemplate()
  if (!sb || !template) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const body = await req.json().catch(() => null)
  const name = String(body?.name ?? '').trim()
  const phone = String(body?.phone ?? '').trim() || null
  if (!name) return NextResponse.json({ ok: false, error: 'falta nombre' }, { status: 400 })
  const token = randToken()
  const { error } = await sb.from('interview_invites').insert({ template_id: template.id, candidate_name: name, candidate_phone: phone, token, status: 'pending' })
  if (error) return NextResponse.json({ ok: false, error: 'no se pudo crear' }, { status: 500 })
  return NextResponse.json({ ok: true, token })
}
