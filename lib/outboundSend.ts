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
// dominio y no mande a spam. Arranca en BASE y suma PASO por cada SEMANA cumplida, hasta TOPE.
// Ritmo atado a lo que se puede llenar con prospectos buenos: semana 1→5, semana 2→6, semana 3→7…
// Dominio nuevo (suups.com.mx) + correo en frío: subir lento es lo seguro. El cap es un techo que
// protege (solo manda lo que haya en cola) y evita picos si un día cargas muchos de golpe.
export const RAMPA_BASE = 5      // envíos/día la primera semana
export const RAMPA_PASO = 1      // +envíos por cada semana cumplida
export const RAMPA_TOPE = 30     // tope diario
export function topeRampa(rampaDesde: string | Date): number {
  const ms = Date.now() - new Date(rampaDesde).getTime()
  const semanas = Math.max(0, Math.floor(ms / (7 * 24 * 3600 * 1000)))
  return Math.min(RAMPA_TOPE, RAMPA_BASE + RAMPA_PASO * semanas)
}

// ¿Es horario hábil en CDMX (lun-vie, 8am-5pm)? Usa offset fijo -6.
export function horarioHabilCDMX(now = new Date()): boolean {
  const cdmx = new Date(now.getTime() - 6 * 3600000)
  const dow = cdmx.getUTCDay(); const hora = cdmx.getUTCHours()
  return dow >= 1 && dow <= 5 && hora >= 8 && hora < 17
}
