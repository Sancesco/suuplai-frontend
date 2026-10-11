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

// Calentamiento (warm-up) del correo: sube poco a poco para que Gmail/Outlook confíen en el
// dominio y no mande a spam. Arranca en BASE y suma PASO por cada día hábil, hasta TOPE.
// Ej.: día hábil 0→5, 1 sem→15, 2 sem→25, 3 sem→35, ~3.5-4 sem→40.
// Ojo: el calentamiento real también depende de respuestas (engagement), no solo del volumen.
export const RAMPA_BASE = 5      // envíos/día al arrancar
export const RAMPA_PASO = 2      // +envíos por cada día hábil
export const RAMPA_TOPE = 40     // tope diario (cold outreach personalizado + con respuestas)
export function topeRampa(rampaDesde: string | Date): number {
  const habiles = diasHabilesEntre(new Date(rampaDesde), new Date())
  return Math.min(RAMPA_TOPE, RAMPA_BASE + RAMPA_PASO * Math.max(0, habiles))
}

// ¿Es horario hábil en CDMX (lun-vie, 8am-5pm)? Usa offset fijo -6.
export function horarioHabilCDMX(now = new Date()): boolean {
  const cdmx = new Date(now.getTime() - 6 * 3600000)
  const dow = cdmx.getUTCDay(); const hora = cdmx.getUTCHours()
  return dow >= 1 && dow <= 5 && hora >= 8 && hora < 17
}
