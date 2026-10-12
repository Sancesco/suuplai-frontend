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
// dominio y no mande a spam. Arranca en BASE y suma PASO por cada SEMANA (escalón en lunes), hasta
// TOPE. Ritmo atado a lo que se puede llenar con prospectos buenos: sem 1→5, sem 2→6, sem 3→7…
// Dominio nuevo (suups.com.mx) + correo en frío: subir lento es lo seguro. El cap es un techo que
// protege (solo manda lo que haya en cola) y evita picos si un día cargas muchos de golpe.
export const RAMPA_BASE = 5      // envíos/día la primera semana
export const RAMPA_PASO = 1      // +envíos por cada semana cumplida
export const RAMPA_TOPE = 30     // tope diario

// Lunes (00:00 CDMX, como timestamp) de la semana a la que pertenece una fecha. Usa el mismo
// corrimiento -6h que el resto de la agenda para agrupar por día/semana de CDMX.
function lunesCDMX(d: Date): number {
  const c = new Date(d.getTime() - 6 * 3600000)
  const base = Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate())
  const dow = (new Date(base).getUTCDay() + 6) % 7 // lunes=0
  return base - dow * 86400000
}

// Tope diario que aplica en la semana de `asOf`. Escalona en lunes para que cuadre con la agenda:
// todos los días de una misma semana comparten el mismo tope.
export function topeRampaEn(rampaDesde: string | Date, asOf: string | Date): number {
  const semanas = Math.floor((lunesCDMX(new Date(asOf)) - lunesCDMX(new Date(rampaDesde))) / (7 * 86400000))
  return Math.min(RAMPA_TOPE, RAMPA_BASE + RAMPA_PASO * Math.max(0, semanas))
}
export function topeRampa(rampaDesde: string | Date): number {
  return topeRampaEn(rampaDesde, new Date())
}

// ¿Es horario hábil en CDMX (lun-vie, 8am-5pm)? Usa offset fijo -6.
export function horarioHabilCDMX(now = new Date()): boolean {
  const cdmx = new Date(now.getTime() - 6 * 3600000)
  const dow = cdmx.getUTCDay(); const hora = cdmx.getUTCHours()
  return dow >= 1 && dow <= 5 && hora >= 8 && hora < 17
}
