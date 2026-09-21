import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getInviteByToken, getTemplate, AUDIO_BUCKET } from '@/lib/interview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extFor(mime: string): string {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'mp4'
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  return 'bin'
}

// Sube UNA respuesta de audio de una pregunta. Multipart: audio, order, duration.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 })
  const invite = await getInviteByToken(params.token)
  const template = await getTemplate()
  if (!invite || !template) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (invite.status === 'completed') return NextResponse.json({ ok: false, error: 'ya_completado' }, { status: 410 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false, error: 'body inválido' }, { status: 400 })
  const file = form.get('audio')
  const order = Number(form.get('order'))
  const duration = Math.max(0, Math.round(Number(form.get('duration')) || 0))
  if (!(file instanceof Blob) || !Number.isInteger(order)) return NextResponse.json({ ok: false, error: 'faltan datos' }, { status: 400 })
  if (!template.questions.some((q) => q.order === order)) return NextResponse.json({ ok: false, error: 'pregunta inválida' }, { status: 400 })
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'audio muy grande' }, { status: 413 })

  const mime = file.type || 'audio/webm'
  const path = `${invite.id}/${order}.${extFor(mime)}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await sb.storage.from(AUDIO_BUCKET).upload(path, buf, { contentType: mime, upsert: true })
  if (upErr) return NextResponse.json({ ok: false, error: 'no se pudo guardar el audio' }, { status: 500 })

  const { error: dbErr } = await sb.from('interview_answers').upsert(
    { invite_id: invite.id, question_order: order, audio_path: path, mime_type: mime, duration_sec: duration },
    { onConflict: 'invite_id,question_order' },
  )
  if (dbErr) return NextResponse.json({ ok: false, error: 'no se pudo registrar' }, { status: 500 })

  if (invite.status === 'pending') await sb.from('interview_invites').update({ status: 'in_progress' }).eq('id', invite.id)

  return NextResponse.json({ ok: true })
}
