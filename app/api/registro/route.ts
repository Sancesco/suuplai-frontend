import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

interface RegistroPayload {
  tipo?: string
  nombre?: string
  apellido?: string
  email?: string
  whatsapp?: string
  [key: string]: unknown
}

export async function POST(req: Request) {
  let body: RegistroPayload
  try {
    body = (await req.json()) as RegistroPayload
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const tipo = body.tipo === 'tienda' || body.tipo === 'productor' ? body.tipo : null
  if (!tipo) {
    return NextResponse.json({ ok: false, error: 'tipo inválido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    // El sitio sigue funcionando aunque el backend no esté configurado aún.
    return NextResponse.json(
      { ok: false, error: 'Backend no configurado (faltan variables de Supabase)' },
      { status: 503 }
    )
  }

  const { tipo: _t, nombre, apellido, email, whatsapp, ...rest } = body

  const { error } = await supabase.from('registros').insert({
    tipo,
    nombre: nombre ?? null,
    apellido: apellido ?? null,
    email: email ?? null,
    whatsapp: whatsapp ?? null,
    data: { nombre, apellido, email, whatsapp, ...rest },
  })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // Email de aviso (no bloquea ni rompe si Resend no está configurado o falla).
  void sendNotification(tipo, body)

  return NextResponse.json({ ok: true })
}

async function sendNotification(tipo: string, body: RegistroPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!apiKey || !to) return

  try {
    const resend = new Resend(apiKey)
    const nombre = [body.nombre, body.apellido].filter(Boolean).join(' ') || 'Sin nombre'
    const negocio =
      (tipo === 'tienda' ? body.nombreTienda : body.nombreMarca) || ''

    const rows = Object.entries(body)
      .filter(([k]) => k !== 'tipo')
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:13px">${k}</td>` +
          `<td style="padding:4px 0;font-size:13px"><strong>${formatVal(v)}</strong></td></tr>`
      )
      .join('')

    // Remitente configurable. Antes de verificar el dominio usa onboarding@resend.dev.
    // Después de verificar suups.com.mx, pon MAIL_FROM="Suuplai <hola@suups.com.mx>".
    const from = process.env.MAIL_FROM || 'Suuplai <onboarding@resend.dev>'
    await resend.emails.send({
      from,
      to,
      subject: `🆕 Nuevo registro ${tipo === 'tienda' ? '🏪 Tienda' : '📦 Marca'}: ${negocio || nombre}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="margin:0 0 4px">Nuevo registro de ${tipo}</h2>
          <p style="color:#666;margin:0 0 16px">${nombre}${negocio ? ` — ${negocio}` : ''}</p>
          <table style="border-collapse:collapse;width:100%">${rows}</table>
        </div>`,
    })
  } catch {
    // Silencioso: si el email falla, el registro YA quedó guardado en la base.
  }
}

function formatVal(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ') || '—'
  if (v === '' || v === null || v === undefined) return '—'
  return String(v)
}
