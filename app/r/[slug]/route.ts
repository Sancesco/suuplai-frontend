import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendTelegram } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LinkRow {
  id: string
  destination: string
  clicks: number
  archived: boolean
  notify: boolean
  label: string | null
}

// Bots, crawlers y previews de mensajería (WhatsApp/Telegram/Slack/Twitter/Facebook…).
const BOT_RE =
  /(bot|crawl|spider|preview|whatsapp|telegram|slack|twitter|facebookexternalhit|facebot|discord|linkedin|pinterest|embed|skype|vkshare|lighthouse|headless)/i

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug
  const origin = new URL(req.url).origin
  const home = new URL('/', origin)

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.redirect(home, 302)

  const { data, error } = await supabase
    .from('links')
    .select('id,destination,clicks,archived,notify,label')
    .eq('slug', slug)
    .maybeSingle()

  const link = data as LinkRow | null
  if (error || !link || link.archived) return NextResponse.redirect(home, 302)

  const dest = new URL(link.destination, origin)

  // ── Señales de la request ──────────────────────────────────────────────────
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '').trim()
  const ua = req.headers.get('user-agent') || ''
  let city = 'desconocido'
  try {
    const c = req.headers.get('x-vercel-ip-city')
    if (c) city = decodeURIComponent(c)
  } catch { /* noop */ }
  const country = req.headers.get('x-vercel-ip-country') || 'desconocido'

  const myIps = (process.env.MY_IP || '').split(',').map((s) => s.trim()).filter(Boolean)
  const isMyIp = Boolean(ip) && myIps.includes(ip)
  const isBot = BOT_RE.test(ua)
  const realClick = !isMyIp && !isBot

  // Solo contamos y notificamos clics reales (ni bots/previews ni yo mismo).
  if (realClick) {
    try {
      const nowISO = new Date().toISOString()
      const newClicks = (link.clicks ?? 0) + 1

      await supabase.from('links').update({ clicks: newClicks, last_click_at: nowISO }).eq('id', link.id)
      await supabase.from('events').insert({
        type: 'link_click',
        src: slug,
        payload: { slug },
        referrer: req.headers.get('referer'),
        user_agent: ua,
        path: `/r/${slug}`,
        city,
        country,
      })

      // ── Alerta Telegram con cooldown de 30 min por slug (claim atómico) ─────
      if (link.notify) {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
        const { data: claimed } = await supabase
          .from('links')
          .update({ last_notified_at: nowISO })
          .eq('id', link.id)
          .eq('notify', true)
          .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`)
          .select('id')

        if (claimed && claimed.length > 0) {
          const device = /mobile|android|iphone|ipad/i.test(ua) ? 'Móvil' : 'Escritorio'
          const hora = new Date().toLocaleTimeString('es-MX', {
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
          })
          const msg =
            `🔔 <b>${escapeHtml(link.label || slug)}</b> abrió tu link\n` +
            `Visita #${newClicks} · ${escapeHtml(city)}, ${escapeHtml(country)}\n` +
            `${device} · ${hora}`
          // Awaited a propósito: en serverless, sin await el fetch se puede matar antes de salir.
          await sendTelegram(msg)
        }
      }
    } catch (e) {
      console.error('[/r] tracking error:', e)
    }
  }

  return NextResponse.redirect(dest, 302)
}
