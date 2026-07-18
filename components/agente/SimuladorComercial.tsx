'use client'

import { useEffect, useRef, useState } from 'react'

const VOID = '#0A0A0F'
const CARBON = '#14141b'
const CARBON2 = '#1c1c25'
const LIME = '#E8FF47'
const EMBER = '#FF6B35'
const BONE = '#F0EFE8'
const ASH = '#8A8A94'
const LINE = '#26262f'

const TOTAL = 108 // 18 × 6

// Cuenta animada — solo anima una vez al montar (respeta reduced-motion).
function useMountCountUp(target: number, enabled: boolean) {
  const [display, setDisplay] = useState(enabled ? 0 : target)
  const doneRef = useRef(!enabled)

  useEffect(() => {
    if (!enabled) {
      setDisplay(target)
      doneRef.current = true
      return
    }
    let raf = 0
    const dur = 420
    const start = performance.now()
    const from = 0
    const to = target
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setDisplay(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
      else doneRef.current = true
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- corre una sola vez al montar
  }, [])

  // Después de la animación de entrada, sigue el valor en vivo de los sliders.
  useEffect(() => {
    if (doneRef.current) setDisplay(target)
  }, [target])

  return display
}

function Readout({
  value,
  label,
  accent,
  animate,
}: {
  value: number
  label: React.ReactNode
  accent: string
  animate: boolean
}) {
  const shown = useMountCountUp(value, animate)
  return (
    <div
      className="flex-1"
      style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', background: 'rgba(0,0,0,.2)' }}
    >
      <div
        className="font-mono"
        style={{ fontWeight: 700, fontSize: 28, color: accent, lineHeight: 1, letterSpacing: '-1px' }}
      >
        {shown}
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: '.5px', textTransform: 'uppercase', color: ASH, marginTop: 8, lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  )
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex justify-between items-baseline" style={{ marginBottom: 9 }}>
        <label htmlFor={id} style={{ fontSize: 13.5, color: '#CFCEC7' }}>
          {label}
        </label>
        <span className="font-mono" style={{ fontWeight: 700, fontSize: 15, color: BONE }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="sim-range"
      />
    </div>
  )
}

export function SimuladorComercial() {
  const [perWeek, setPerWeek] = useState(10)
  const [rate, setRate] = useState(20)
  const [animate, setAnimate] = useState(false)

  // Activa la animación de entrada tras montar, salvo que el usuario prefiera menos movimiento.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduce) setAnimate(true)
  }, [])

  const perMonth = perWeek * 4
  const newAcc = Math.round((perMonth * rate) / 100)
  const six = newAcc * 6
  const lit = Math.min(six, TOTAL)

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${CARBON}, ${VOID})`,
        border: `1px solid ${LINE}`,
        borderRadius: 22,
        padding: '26px 26px 30px',
      }}
    >
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: '-40%',
          right: '-30%',
          width: '70%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(232,255,71,.10), transparent 70%)',
        }}
      />

      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <div className="font-syne" style={{ fontWeight: 700, fontSize: 16 }}>
          Tu motor, en vivo
        </div>
        <div
          className="font-mono flex items-center"
          style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: LIME, gap: 7 }}
        >
          <span className="sim-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: LIME, display: 'inline-block' }} />
          Simulando
        </div>
      </div>

      {/* grid de tiendas */}
      <div
        aria-hidden
        className="grid grid-cols-[repeat(14,minmax(0,1fr))] sm:grid-cols-[repeat(18,minmax(0,1fr))]"
        style={{ gap: 4, marginBottom: 24, padding: '4px 0' }}
      >
        {Array.from({ length: TOTAL }).map((_, i) => {
          const on = i < lit
          const isEdge = i === lit - 1
          return (
            <div
              key={i}
              className="aspect-square rounded-[2px]"
              style={{
                background: on ? (isEdge ? EMBER : LIME) : CARBON2,
                transition: 'background .4s ease',
              }}
            />
          )
        })}
      </div>

      {/* readouts */}
      <div className="flex" style={{ gap: 12, marginBottom: 22 }}>
        <Readout value={newAcc} accent={LIME} animate={animate} label={<>Cuentas nuevas<br />por mes</>} />
        <Readout value={six} accent={EMBER} animate={animate} label={<>Puntos activos<br />a 6 meses</>} />
        <Readout value={perMonth} accent={LIME} animate={animate} label={<>Muestras<br />por mes</>} />
      </div>

      {/* sliders */}
      <Slider id="sim-week" label="Muestras por semana" value={perWeek} min={5} max={20} onChange={setPerWeek} />
      <Slider id="sim-rate" label="Tasa de éxito por muestra" value={rate} min={10} max={30} suffix="%" onChange={setRate} />
    </div>
  )
}
