// Envía un mensaje a Telegram (usa TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID). No bloquea.
export async function sendTelegram(text: string): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chat = process.env.TELEGRAM_CHAT_ID
    if (!token || !chat) return
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
  } catch { /* noop */ }
}
