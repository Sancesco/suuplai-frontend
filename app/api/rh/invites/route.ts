import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { checkRh, getTemplate, knockoutHits, labelFor, randToken, type Invite, type Template } from '@/lib/interview'
import { getRole, defaultRole, rolesList } from '@/lib/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })

  // Lista TODAS las invitaciones (de cualquier plantilla); cada una usa la suya.
  const { data: invRows } = await sb.from('interview_invites').select('*').order('invited_at', { ascending: false })
  const invites = (invRows ?? []) as Invite[]

  const { data: tplRows } = await sb.from('interview_templates').select('*')
  const templates = new Map<string, Template>()
  for (const t of (tplRows ?? []) as Template[]) templates.set(t.id, t)

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
  const now = Date.now()

  const list = invites.map((i) => {
    const tpl = templates.get(i.template_id)
    const nQ = tpl?.questions.length ?? 0
    const total = scoreByInvite.get(i.id) || 0
    const scored = scoredCount.get(i.id) || 0
    const ko = tpl ? knockoutHits(tpl.quick_fields, i.quick_answers || {}) : []
    const stale = i.status !== 'completed' && i.status !== 'discarded' && i.status !== 'call_scheduled' && now - new Date(i.invited_at).getTime() > 3 * 86400000
    // Calificación de la IA (si existe) para el encabezado/lista.
    const cal = (i.analysis && typeof i.analysis === 'object') ? (i.analysis as { calificacion?: { dimensiones?: { score?: number }[]; recomendacion?: string } }).calificacion : null
    const aiDims = cal?.dimensiones || []
    const aiTotal = aiDims.reduce((a, x) => a + (x?.score || 0), 0)
    return {
      id: i.id, name: i.candidate_name, phone: i.candidate_phone, status: i.status,
      invited_at: i.invited_at, completed_at: i.completed_at,
      interview: tpl?.title ?? '—',
      answered: answeredCount.get(i.id) || 0, scored, total, maxTotal: nQ * 3,
      label: (tpl && scored === nQ && nQ > 0) ? labelFor(total, tpl.thresholds) : null,
      aiTotal: aiDims.length ? aiTotal : null, aiMax: aiDims.length ? aiDims.length * 3 : null, aiRec: cal?.recomendacion || null,
      knockout: ko, stale,
    }
  })
  const role = defaultRole()
  return NextResponse.json({
    ok: true,
    template: { title: role.name, questions: role.fixed_questions.length, thresholds: { call: 0, review: 0 } },
    base: { quick_fields: role.quick_fields, questions: role.fixed_questions },
    roles: rolesList(),
    invites: list,
  })
}

function slugName(n: string) { return n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() }

type QIn = { text?: string; maxSeconds?: number; rubric?: Record<string, string> }

// Avisa por correo que una entrevista quedó LISTA PARA ENVIAR (no bloquea si Resend no está).
async function emailListo(origin: string, name: string, phone: string | null, role: string, link: string, qs: { text: string }[]) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const from = process.env.MAIL_FROM || 'Suuplai <onboarding@resend.dev>'
    const to = process.env.NOTIFY_EMAIL || 'santiago@suups.com.mx'
    const first = name.split(/\s+/)[0]
    const preguntas = qs.map((q) => `<li>${q.text}</li>`).join('')
    const waMsg = `Hola ${first}, gracias por escribir. Antes de coordinar la llamada me encantaría que me ayudes con esta mini-entrevista en audio: la contestas desde tu celular cuando quieras, son unos 10 min y no instalas nada. Aquí está tu link personal:\n${link}`
    const digits = (phone || '').replace(/\D/g, ''); const waNum = digits.length === 10 ? '52' + digits : digits
    const waLink = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}` : ''
    await resend.emails.send({
      from, to,
      subject: `✅ Entrevista lista para enviar: ${name} (${role})`,
      html: `<p>La entrevista personalizada de <b>${name}</b> para <b>${role}</b> ya está <b>lista para enviar</b>.</p>
${waLink ? `<p><a href="${waLink}" style="background:#111;color:#E8FF47;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Abrir WhatsApp con ${first} →</a></p>` : ''}
<p><b>Mensaje listo para copiar:</b></p>
<blockquote style="border-left:3px solid #E8FF47;padding-left:10px;color:#333;white-space:pre-wrap">${waMsg}</blockquote>
<p><b>Link:</b> <a href="${link}">${link}</a></p>
<p><b>Preguntas:</b></p><ol>${preguntas}</ol>
<p><a href="${origin}/rh">Ver en el panel de RH →</a></p>`,
    })
  } catch (e) { console.error('[invites] email error', e) }
}

export async function POST(req: Request) {
  if (!checkRh(req)) return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 })
  const sb = getSupabaseAdmin(); const def = await getTemplate()
  if (!sb || !def) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const body = await req.json().catch(() => null)
  const name = String(body?.name ?? '').trim()
  const phone = String(body?.phone ?? '').trim() || null
  if (!name) return NextResponse.json({ ok: false, error: 'falta nombre' }, { status: 400 })
  const role = getRole(body?.roleKey) ?? defaultRole()

  // Si mandan preguntas personalizadas, se crea una plantilla propia para este candidato.
  let templateId = def.id
  let createdQs: { text: string }[] = []
  const rawQ = Array.isArray(body?.questions) ? (body.questions as QIn[]) : null
  if (rawQ) {
    const qs = rawQ
      .map((q, i) => ({
        order: i + 1,
        text: String(q?.text ?? '').trim(),
        maxSeconds: Number(q?.maxSeconds) > 0 ? Number(q.maxSeconds) : 90,
        rubric: {
          '1': String(q?.rubric?.['1'] ?? '').trim() || 'Flojo o no responde',
          '2': String(q?.rubric?.['2'] ?? '').trim() || 'Aceptable',
          '3': String(q?.rubric?.['3'] ?? '').trim() || 'Muy bien, ejemplo concreto',
        },
      }))
      .filter((q) => q.text)
    if (!qs.length) return NextResponse.json({ ok: false, error: 'faltan preguntas' }, { status: 400 })
    createdQs = qs
    const max = qs.length * 3
    const thresholds = { call: Math.round(max * 0.78), review: Math.round(max * 0.61) }
    const first = name.split(/\s+/)[0]
    const slug = `${role.key}-${slugName(name)}-${randToken().slice(0, 6).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`
    const { data: tpl, error: tErr } = await sb.from('interview_templates').insert({
      slug, title: `${role.name} · ${first}`,
      intro: 'Mini-entrevista en audio. Contéstala desde tu celular cuando quieras, sin instalar nada. Toma unos 10 minutos.',
      quick_fields: role.quick_fields, questions: qs, thresholds, is_active: false,
    }).select('id').single()
    if (tErr || !tpl) return NextResponse.json({ ok: false, error: 'no se pudo crear la plantilla' }, { status: 500 })
    templateId = tpl.id
  }

  const token = randToken()
  const { error } = await sb.from('interview_invites').insert({ template_id: templateId, candidate_name: name, candidate_phone: phone, token, status: 'pending' })
  if (error) return NextResponse.json({ ok: false, error: 'no se pudo crear' }, { status: 500 })

  const origin = new URL(req.url).origin
  await emailListo(origin, name, phone, role.name, `${origin}/entrevista/${token}`, createdQs)
  return NextResponse.json({ ok: true, token })
}
