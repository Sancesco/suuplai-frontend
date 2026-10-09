// Relleno de plantilla, días hábiles, rampa de volumen y horario hábil (CDMX).

export function primerNombre(persona: string | null): string {
  return (persona || '').trim().split(/\s+/)[0] || ''
}

export function rellenar(txt: string, v: { nombre: string; empresa: string; gancho?: string; slug: string; asunto?: string }): string {
  return txt
    .replace(/\{\{nombre\}\}/g, v.nombre)
    .replace(/\{\{empresa\}\}/g, v.empresa)
    .replace(/\{\{gancho\}\}/g, v.gancho || '')
    .replace(/\{\{slug\}\}/g, v.slug)
    .replace(/\{\{asunto\}\}/g, v.asunto || '')
    .replace(/[ \t]{2,}/g, ' ') // si el gancho queda vacío, no dejar doble espacio
}

// Suma N días hábiles (lun-vie) a una fecha.
export function sumarDiasHabiles(desde: Date, n: number): Date {
  const d = new Date(desde); let c = 0
  while (c < n) { d.setDate(d.getDate() + 1); const dow = d.getUTCDay(); if (dow !== 0 && dow !== 6) c++ }
  return d
}
// Días hábiles transcurridos entre dos fechas.
export function diasHabilesEntre(a: Date, b: Date): number {
  let c = 0; const d = new Date(a)
  while (d < b) { d.setDate(d.getDate() + 1); const dow = d.getUTCDay(); if (dow !== 0 && dow !== 6) c++ }
  return c
}

// Tope diario por semana de rampa: 1-2→5, 3-4→10, 5-6→20, después→25.
export function topeRampa(rampaDesde: string | Date): number {
  const dias = Math.floor((Date.now() - new Date(rampaDesde).getTime()) / 86400000)
  const semana = Math.floor(dias / 7) + 1
  if (semana <= 2) return 5
  if (semana <= 4) return 10
  if (semana <= 6) return 20
  return 25
}

// ¿Es horario hábil en CDMX (lun-vie, 8am-5pm)? Usa offset fijo -6.
export function horarioHabilCDMX(now = new Date()): boolean {
  const cdmx = new Date(now.getTime() - 6 * 3600000)
  const dow = cdmx.getUTCDay(); const hora = cdmx.getUTCHours()
  return dow >= 1 && dow <= 5 && hora >= 8 && hora < 17
}
