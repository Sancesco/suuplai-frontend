// Parser simple de user-agent → tipo / navegador / SO.
export interface Device {
  type: 'Móvil' | 'Escritorio'
  browser: string
  os: string
}

export function parseUa(ua: string | null | undefined): Device {
  const u = ua || ''
  const type: Device['type'] = /mobile|android|iphone|ipad|ipod/i.test(u) ? 'Móvil' : 'Escritorio'

  let os = 'Otro'
  if (/iphone|ipad|ipod/i.test(u)) os = 'iOS'
  else if (/android/i.test(u)) os = 'Android'
  else if (/windows/i.test(u)) os = 'Windows'
  else if (/mac os x|macintosh/i.test(u)) os = 'macOS'
  else if (/linux/i.test(u)) os = 'Linux'

  let browser = 'Otro'
  if (/edg\//i.test(u)) browser = 'Edge'
  else if (/opr\/|opera/i.test(u)) browser = 'Opera'
  else if (/chrome|crios/i.test(u)) browser = 'Chrome'
  else if (/firefox|fxios/i.test(u)) browser = 'Firefox'
  else if (/safari/i.test(u)) browser = 'Safari'

  return { type, browser, os }
}

// Clave única de dispositivo para detectar "dispositivos distintos" y compartidos.
export function deviceKey(ua: string | null | undefined): string {
  const d = parseUa(ua)
  return `${d.type} · ${d.browser} · ${d.os}`
}
