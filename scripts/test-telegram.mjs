// Prueba de Telegram: verifica TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.
// Uso: npm run test:telegram
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

// Carga .env.local (Node no lo hace solo para scripts sueltos).
try {
  const raw = readFileSync(join(here, '..', '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* si no hay .env.local, usa process.env */
}

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID
if (!token || !chatId) {
  console.error('❌ Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env.local')
  process.exit(1)
}

const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: '✅ <b>test:telegram</b> de Suuplai — token y chat_id correctos.',
    parse_mode: 'HTML',
  }),
})
const json = await res.json()
if (json.ok) {
  console.log('✅ Mensaje enviado. Revisa tu Telegram.')
} else {
  console.error('❌ Error de Telegram:', JSON.stringify(json))
  process.exit(1)
}
