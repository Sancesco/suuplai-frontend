import { getSupabaseAdmin } from './supabaseAdmin'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly']

function creds() {
  const client_id = process.env.GOOGLE_CLIENT_ID
  const client_secret = process.env.GOOGLE_CLIENT_SECRET
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'https://www.suuplai.com.mx/api/outbound/gmail/callback'
  if (!client_id || !client_secret) throw new Error('faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET')
  return { client_id, client_secret, redirect_uri }
}

export function getAuthUrl(): string {
  const { client_id, redirect_uri } = creds()
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.searchParams.set('client_id', client_id)
  u.searchParams.set('redirect_uri', redirect_uri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', SCOPES.join(' '))
  u.searchParams.set('access_type', 'offline')
  u.searchParams.set('prompt', 'consent')
  u.searchParams.set('include_granted_scopes', 'true')
  return u.toString()
}

// Intercambia el code por tokens y guarda el refresh_token.
export async function exchangeCode(sb: SB, code: string): Promise<string> {
  const { client_id, client_secret, redirect_uri } = creds()
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id, client_secret, redirect_uri, grant_type: 'authorization_code' }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error('OAuth: ' + (j.error_description || j.error || 'error'))
  const access = j.access_token as string
  // email de la cuenta conectada
  let email = ''
  try { const p = await (await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${access}` } })).json(); email = p.emailAddress || '' } catch { /* opcional */ }
  await sb.from('outbound_gmail').upsert({
    id: 1, email, refresh_token: j.refresh_token ?? null, access_token: access,
    expiry: new Date(Date.now() + (Number(j.expires_in) || 3600) * 1000).toISOString(), scope: j.scope ?? null, connected_at: new Date().toISOString(),
  })
  return email
}

// Devuelve un access_token válido (refresca si hace falta).
export async function getAccessToken(sb: SB): Promise<string> {
  const { data } = await sb.from('outbound_gmail').select('*').eq('id', 1).maybeSingle()
  if (!data?.refresh_token) throw new Error('Gmail no está conectado')
  if (data.access_token && data.expiry && new Date(data.expiry).getTime() > Date.now() + 60000) return data.access_token as string
  const { client_id, client_secret } = creds()
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id, client_secret, refresh_token: data.refresh_token as string, grant_type: 'refresh_token' }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error('refresh: ' + (j.error_description || j.error || 'error'))
  const access = j.access_token as string
  await sb.from('outbound_gmail').update({ access_token: access, expiry: new Date(Date.now() + (Number(j.expires_in) || 3600) * 1000).toISOString() }).eq('id', 1)
  return access
}

export async function gmailConectado(sb: SB): Promise<{ conectado: boolean; email: string | null }> {
  const { data } = await sb.from('outbound_gmail').select('email,refresh_token').eq('id', 1).maybeSingle()
  return { conectado: !!data?.refresh_token, email: data?.email ?? null }
}

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function encSubject(s: string): string {
  return /[^\x00-\x7F]/.test(s) ? `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=` : s
}

// Envía un correo (nuevo o como respuesta dentro de un hilo). Devuelve ids.
export async function enviarCorreo(sb: SB, o: {
  from: string; fromNombre: string; to: string; subject: string; text: string
  threadId?: string | null; inReplyTo?: string | null; references?: string | null
}): Promise<{ threadId: string; gmailId: string; messageId: string }> {
  const token = await getAccessToken(sb)
  const h = [
    `From: ${o.fromNombre} <${o.from}>`, `To: ${o.to}`, `Subject: ${encSubject(o.subject)}`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit',
  ]
  if (o.inReplyTo) { h.push(`In-Reply-To: ${o.inReplyTo}`); h.push(`References: ${o.references || o.inReplyTo}`) }
  const raw = b64url(h.join('\r\n') + '\r\n\r\n' + o.text)
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw, ...(o.threadId ? { threadId: o.threadId } : {}) }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error('Gmail send: ' + (j.error?.message || 'error'))
  // recupera el RFC822 Message-ID (para encadenar recordatorios)
  let messageId = ''
  try {
    const m = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${j.id}?format=metadata&metadataHeaders=Message-ID`, { headers: { Authorization: `Bearer ${token}` } })).json()
    messageId = (m.payload?.headers || []).find((x: { name: string }) => x.name.toLowerCase() === 'message-id')?.value || ''
  } catch { /* no crítico */ }
  return { threadId: j.threadId as string, gmailId: j.id as string, messageId }
}

export type ThreadMsg = { from: string; fromMe: boolean; esRebote: boolean; internalDate: number }

// Lee un hilo y devuelve sus mensajes (para detectar respuesta o rebote).
export async function leerHilo(sb: SB, threadId: string, miEmail: string): Promise<ThreadMsg[]> {
  const token = await getAccessToken(sb)
  const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`, { headers: { Authorization: `Bearer ${token}` } })
  const j = await r.json()
  if (!r.ok) throw new Error('Gmail thread: ' + (j.error?.message || 'error'))
  const mine = miEmail.toLowerCase()
  return (j.messages || []).map((m: { payload?: { headers?: { name: string; value: string }[] }; internalDate?: string }) => {
    const from = (m.payload?.headers || []).find((x) => x.name.toLowerCase() === 'from')?.value || ''
    const low = from.toLowerCase()
    return { from, fromMe: low.includes(mine), esRebote: /mailer-daemon|postmaster|mail delivery/i.test(low), internalDate: Number(m.internalDate || 0) }
  })
}
