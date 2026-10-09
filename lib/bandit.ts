// Bandit (Thompson sampling) para elegir variantes y aprender solo cuál funciona.
// Cada brazo lleva un posterior Beta(alfa,beta). Se muestrea de cada uno y gana el más alto.

export type Brazo = {
  id: string; perilla: string; texto: string; es_control: boolean; activa: boolean
  envios: number; envios_maduros: number; clics: number; respuestas: number; alfa: number; beta: number
}

// Muestra de una Gamma(k,1) (Marsaglia-Tsang). Para k<1 usa el truco de boost.
function gamma(k: number): number {
  if (k < 1) return gamma(k + 1) * Math.pow(Math.random() || 1e-12, 1 / k)
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x = 0, v = 0
    do { x = normal(); v = 1 + c * x } while (v <= 0)
    v = v * v * v
    const u = Math.random()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}
function normal(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
export function muestraBeta(a: number, b: number): number {
  const x = gamma(a), y = gamma(b)
  return x / (x + y || 1)
}

// Total de envíos de una perilla (para el tope del brazo joven).
function total(brazos: Brazo[]): number { return brazos.reduce((s, b) => s + b.envios, 0) }

// Elige un brazo: muestrea Beta de cada activo, gana el más alto; con pisos/topes de seguridad.
export function elegirBrazo(brazos: Brazo[]): Brazo | null {
  const vivos = brazos.filter((b) => b.activa)
  if (!vivos.length) return null
  if (vivos.length === 1) return vivos[0]
  // 10% de exploración uniforme: un brazo que arrancó mal puede recuperarse.
  if (Math.random() < 0.1) return vivos[Math.floor(Math.random() * vivos.length)]
  const ganador = vivos.map((b) => ({ b, s: muestraBeta(b.alfa, b.beta) })).sort((a, z) => z.s - a.s)[0].b
  // Un brazo joven (no control) no se lleva más del 60% hasta madurar 40 envíos.
  if (!ganador.es_control && ganador.envios_maduros < 40) {
    const share = ganador.envios / Math.max(1, total(brazos))
    const control = brazos.find((b) => b.es_control && b.activa)
    if (share > 0.6 && control) return control
  }
  return ganador
}
