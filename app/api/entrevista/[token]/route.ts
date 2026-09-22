import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getInviteByToken, getTemplateById } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Estado para que el candidato reanude donde se quedó (sin login).
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const invite = await getInviteByToken(params.token)
  const template = invite ? await getTemplateById(invite.template_id) : null
  if (!invite || !template) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  // Registra la primera apertura del link (métrica de proceso). Ignora si la columna no existe aún.
  if (!(invite as { first_opened_at?: string | null }).first_opened_at) {
    try { await sb.from('interview_invites').update({ first_opened_at: new Date().toISOString() }).eq('id', invite.id) } catch { /* columna aún no creada */ }
  }

  const { data: ans } = await sb.from('interview_answers').select('question_order').eq('invite_id', invite.id)
  const answered = (ans ?? []).map((a) => a.question_order as number)

  return NextResponse.json({
    ok: true,
    candidate_name: invite.candidate_name,
    status: invite.status,
    consentDone: !!invite.consent_at,
    quickAnswers: invite.quick_answers || {},
    answered,
    template: {
      title: template.title,
      intro: template.intro,
      quick_fields: template.quick_fields,
      // sin rúbrica: el candidato no la ve
      questions: template.questions.map((q) => ({ order: q.order, text: q.text, maxSeconds: q.maxSeconds })),
    },
  })
}

// Acciones del candidato: consent, quick, complete.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const invite = await getInviteByToken(params.token)
  const template = invite ? await getTemplateById(invite.template_id) : null
  if (!invite || !template) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (invite.status === 'completed') return NextResponse.json({ ok: false, error: 'ya_completado' }, { status: 410 })

  const body = await req.json().catch(() => null)
  const action = String(body?.action ?? '')

  if (action === 'consent') {
    await sb.from('interview_invites').update({ consent_at: invite.consent_at ?? new Date().toISOString(), status: invite.status === 'pending' ? 'in_progress' : invite.status }).eq('id', invite.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'quick') {
    const answers = (body?.answers && typeof body.answers === 'object') ? body.answers as Record<string, string> : {}
    // valida requeridos de la plantilla
    for (const f of template.quick_fields) {
      if (f.required && !String(answers[f.key] ?? '').trim()) return NextResponse.json({ ok: false, error: 'faltan_campos' }, { status: 400 })
    }
    const clean: Record<string, string> = {}
    for (const f of template.quick_fields) if (answers[f.key] != null) clean[f.key] = String(answers[f.key]).trim()
    await sb.from('interview_invites').update({ quick_answers: clean, status: invite.status === 'pending' ? 'in_progress' : invite.status }).eq('id', invite.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'complete') {
    const { count } = await sb.from('interview_answers').select('*', { count: 'exact', head: true }).eq('invite_id', invite.id)
    if ((count ?? 0) < template.questions.length) return NextResponse.json({ ok: false, error: 'faltan_respuestas' }, { status: 400 })
    await sb.from('interview_invites').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', invite.id)
    // Correo de aviso (no bloquea si Resend no está configurado).
    try {
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)
        const from = process.env.MAIL_FROM || 'Suuplai <onboarding@resend.dev>'
        const to = process.env.NOTIFY_EMAIL || 'santiago@suups.com.mx'
        const origin = new URL(req.url).origin
        await resend.emails.send({
          from, to,
          subject: `🎙️ ${invite.candidate_name} terminó la entrevista`,
          html: `<p><b>${invite.candidate_name}</b> completó la entrevista <b>${template.title}</b>.</p><p><a href="${origin}/rh">Ver y calificar sus respuestas →</a></p>`,
        })
      }
    } catch (e) { console.error('[entrevista] email error', e) }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: 'accion_invalida' }, { status: 400 })
}
