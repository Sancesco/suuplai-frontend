import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Marca esta compu/navegador como "dueño": sus clics y aperturas dejan de contar.
// Visita https://www.suuplai.com.mx/api/outbound/soy-yo una vez por dispositivo.
// Con ?off=1 lo quita.
export async function GET(req: Request) {
  const off = new URL(req.url).searchParams.get('off') === '1'
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#0A0A0F;color:#F0EFE8;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px"><div><div style="font-size:48px">${off ? '🔄' : '✅'}</div><h2>${off ? 'Esta compu vuelve a contar' : 'Listo: esta compu ya no cuenta como apertura'}</h2><p style="color:#9c948a">${off ? 'Tus aperturas y clics volverán a registrarse.' : 'Tus clics y aperturas en los links de outbound ya no ensucian la data.'}</p></div></body>`
  const res = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  if (off) res.headers.set('Set-Cookie', 'suu_owner=; Path=/; Max-Age=0; SameSite=Lax')
  else res.headers.set('Set-Cookie', 'suu_owner=1; Path=/; Max-Age=31536000; SameSite=Lax')
  return res
}
