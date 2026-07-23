// Envío de mensajes a Telegram. Envuelto en try/catch: si falla, solo console.error.
// NUNCA lanza excepción ni retrasa nada (se llama sin await desde el redirect).
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch (err) {
    console.error('[telegram] error:', err)
  }
}
