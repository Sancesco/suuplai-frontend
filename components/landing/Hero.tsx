'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATION_SPEED = 3500

const STATS = [
  { number: '+40',    unit: 'puntos', label: 'de venta activos en CDMX y creciendo',                  color: '#E8FF47' },
  { number: '<14',    unit: 'días',   label: 'onboarding promedio — de contrato a tienda',            color: '#E8FF47' },
  { number: '6',      unit: 'cadenas',label: 'socias: Alchef, Casa Bruna, Moramora, SuperCope, Comando, Numu', color: '#F0EFE8' },
  { number: '0%',     unit: '',       label: 'comisión sobre ventas para la tienda',                  color: '#E8FF47' },
  { number: '$2,000', unit: 'MXN/mes',label: 'costo de entrada por marca — sin penalizaciones',       color: '#FF6B35' },
  { number: '4',      unit: 'marcas', label: 'máximo por espacio — tu tienda no se satura',           color: '#E8FF47' },
  { number: '94%',    unit: 'menos',  label: 'costo de entrada vs Walmart, Liverpool o Chedraui',     color: '#FF6B35' },
  { number: '48h',    unit: '',       label: 'para confirmar si hay fit entre tu marca y una tienda', color: '#FF6B35' },
  { number: '4',      unit: 'marcas', label: 'por espacio — tu producto se ve, no compite con cientos', color: '#FF6B35' },
  { number: '3',      unit: 'semanas',label: 'para saber en qué colonia rota mejor tu producto',      color: '#F0EFE8' },
  { number: '0',      unit: 'inv.',   label: 'la tienda no compra nada, no arriesga nada — puro ingreso', color: '#F0EFE8' },
  { number: '1.2M',   unit: 'tiendas',label: 'en México sin acceso a herramientas — tú llegas primero', color: '#F0EFE8' },
]

// 4 cards show different stats simultaneously, offset by 3 positions each
const CARD_OFFSETS = [0, 3, 6, 9]

// ─── Headline intro animation — "All of the Lights" flashes ────────────────────

const BG     = '#0A0A0F'
const LIME   = '#E8FF47'
const ORANGE = '#FF6B35'
const GOLD   = '#F5C518'
const WHITE  = '#F0EFE8'
const MUTED  = 'rgba(240,239,232,0.4)'
const INTRO_DURATION = 2.2

// Build snap-style keyframes from a list of [time_s, color] events.
// Inserts a 1ms hold before each color change so adjacent keyframes don't blend.
function buildKeyframes(
  events: ReadonlyArray<readonly [number, string]>
): { color: string[]; times: number[] } {
  const colors: string[] = []
  const times: number[] = []
  const EPS = 0.001
  events.forEach((evt, i) => {
    const [time, color] = evt
    if (i === 0) {
      times.push(0)
      colors.push(color)
      return
    }
    const prevColor = events[i - 1][1]
    times.push(Math.max(0, time - EPS))
    colors.push(prevColor)
    times.push(time)
    colors.push(color)
  })
  const lastTime = events[events.length - 1][0]
  if (lastTime < INTRO_DURATION) {
    times.push(INTRO_DURATION)
    colors.push(events[events.length - 1][1])
  }
  return {
    color: colors,
    times: times.map(s => s / INTRO_DURATION),
  }
}

type WordKF = { text: string; kf: ReturnType<typeof buildKeyframes> }

// Shared "line 1 finale": after individual flashes, all words alternate orange/lime,
// strong cut, then a final lime flash + settle. Each line 1 word inherits this tail.
const LINE1_FINALE = [
  [1.18, ORANGE],
  [1.24, LIME],
  [1.30, ORANGE],
  [1.36, LIME],
  [1.40, BG],
  [1.95, LIME],
  [2.00, BG],
] as const

// Line 1 — each word with its own intro, then shared finale, then final settle color
const LINE1: WordKF[] = [
  {
    text: 'Tu ',
    kf: buildKeyframes([
      [0,    BG],
      [0.08, LIME],
      [0.15, BG],
      [0.33, GOLD],      // "Tu marca" joint flash
      [0.42, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'marca ',
    kf: buildKeyframes([
      [0,    BG],
      [0.20, ORANGE],
      [0.28, BG],
      [0.33, GOLD],      // "Tu marca" joint flash
      [0.42, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'en ',
    kf: buildKeyframes([
      [0,    BG],
      [0.48, LIME],      // "en tiendas" joint flash
      [0.68, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'tiendas ',
    kf: buildKeyframes([
      [0,    BG],
      [0.48, LIME],      // "en tiendas" joint flash
      [0.68, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'físicas ',
    kf: buildKeyframes([
      [0,    BG],
      [0.58, ORANGE],
      [0.68, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'de ',
    kf: buildKeyframes([
      [0,    BG],
      [0.73, GOLD],
      [0.78, BG],
      ...LINE1_FINALE,
      [2.15, WHITE],
    ]),
  },
  {
    text: 'CDMX.',
    kf: buildKeyframes([
      [0,    BG],
      [0.80, LIME],      // brilliant lime
      [0.90, WHITE],     // off-white
      [1.00, ORANGE],    // preview of final color
      [1.10, BG],
      ...LINE1_FINALE,
      [2.15, ORANGE],    // FINAL — orange Suuplai
    ]),
  },
]

// Line 2 — staggered word flashes inside "En 14 días,", then cut, then "no en 6 meses." enters
const LINE2_PRE: WordKF[] = [
  {
    text: 'En ',
    kf: buildKeyframes([
      [0,    BG],
      [1.48, LIME],
      [1.73, BG],
      [2.15, LIME],
    ]),
  },
  {
    text: '14 ',
    kf: buildKeyframes([
      [0,    BG],
      [1.55, ORANGE],    // big orange flash
      [1.73, BG],
      [2.15, LIME],
    ]),
  },
  {
    text: 'días, ',
    kf: buildKeyframes([
      [0,    BG],
      [1.63, LIME],
      [1.73, BG],
      [2.15, LIME],
    ]),
  },
]

const NO6MESES_KF = buildKeyframes([
  [0,    BG],
  [1.80, MUTED],
])

// ─── Framer Motion variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
}

const statVariants = {
  enter:  { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

// ─── StatCard — defined outside Hero to avoid remount on every render ─────────

interface StatCardProps {
  stat: typeof STATS[0]
  tick: number
  cardIndex: number
}

function StatCard({ stat, tick, cardIndex }: StatCardProps) {
  const { color, number, unit, label } = stat

  // Border opacity: neutral stats get a dimmer border
  const borderHex = color === '#F0EFE8' ? 'rgba(240,239,232,0.15)' : `${color}30`

  return (
    <div
      className="relative flex flex-col rounded-card overflow-hidden"
      style={{
        background: '#13131A',
        border: `1px solid ${borderHex}`,
        minHeight: '148px',
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* Progress bar — key changes each tick, restarting the CSS animation */}
      <div
        key={`pb-${tick}`}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: color,
          animation: `statProgress ${ROTATION_SPEED}ms linear forwards`,
          opacity: cardIndex === 0 ? 0.8 : 0.4,
        }}
      />

      {/* Animated content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`sc-${tick}-${cardIndex}`}
          variants={statVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col gap-2 p-6"
        >
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: 'clamp(24px, 3.2vw, 36px)',
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}
            >
              {number}
            </span>
            {unit && (
              <span
                className="font-dm"
                style={{ fontSize: '11px', color, fontWeight: 400, opacity: 0.75 }}
              >
                {unit}
              </span>
            )}
          </div>
          <span
            className="font-dm"
            style={{
              fontSize: '12px',
              color: 'rgba(240,239,232,0.55)',
              lineHeight: 1.5,
              fontWeight: 300,
            }}
          >
            {label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const [tick, setTick]       = useState(0)
  const timerRef              = useRef<ReturnType<typeof setInterval>  | null>(null)
  const timeoutRef            = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTick((t) => t + 1), ROTATION_SPEED)
  }, [])

  useEffect(() => {
    startAutoplay()
    return () => {
      if (timerRef.current)   clearInterval(timerRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [startAutoplay])

  const activeDotIndex = tick % STATS.length
  const activeColor    = STATS[activeDotIndex].color
  const prefersReducedMotion = useReducedMotion()
  // Delays for elements that appear AFTER the headline intro — skipped when reduce motion is on
  const d = (s: number) => (prefersReducedMotion ? 0.1 : s)

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden"
      style={{ background: '#0A0A0F' }}
    >
      {/* Radial glow backdrop — dual yellow + orange halos */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% 50%, rgba(232,255,71,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 50%, rgba(255,107,53,0.07) 0%, transparent 70%)
          `,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">

        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill mb-8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="w-2 h-2 rounded-full hero-badge-dot" />
          <span className="font-dm text-sm" style={{ color: 'rgba(240,239,232,0.7)' }}>
            Únete a la waitlist — acceso anticipado en CDMX
          </span>
        </motion.div>

        {/* H1 — "All of the Lights" intro: each word flashes in brand colors, settles to final state */}
        <h1
          className="font-syne font-extrabold mb-6"
          style={{
            fontSize: 'clamp(38px, 6.5vw, 80px)',
            letterSpacing: '-2px',
            lineHeight: 1.05,
          }}
        >
          {prefersReducedMotion ? (
            <>
              <span style={{ color: WHITE }}>Tu marca en tiendas físicas de </span>
              <span style={{ color: ORANGE }}>CDMX.</span>
              <br />
              <span style={{ color: LIME }}>En 14 días,</span>{' '}
              <span style={{ color: MUTED }}>no en 6 meses.</span>
            </>
          ) : (
            <>
              {LINE1.map((w, i) => (
                <motion.span
                  key={`l1-${i}`}
                  initial={{ color: BG }}
                  animate={{ color: w.kf.color }}
                  transition={{
                    duration: INTRO_DURATION,
                    ease: 'linear',
                    times: w.kf.times,
                  }}
                  style={{ willChange: 'color' }}
                >
                  {w.text}
                </motion.span>
              ))}
              <br />
              {LINE2_PRE.map((w, i) => (
                <motion.span
                  key={`l2-${i}`}
                  initial={{ color: BG }}
                  animate={{ color: w.kf.color }}
                  transition={{
                    duration: INTRO_DURATION,
                    ease: 'linear',
                    times: w.kf.times,
                  }}
                  style={{ willChange: 'color' }}
                >
                  {w.text}
                </motion.span>
              ))}
              <motion.span
                initial={{ color: BG }}
                animate={{ color: NO6MESES_KF.color }}
                transition={{
                  duration: INTRO_DURATION,
                  ease: 'linear',
                  times: NO6MESES_KF.times,
                }}
                style={{ willChange: 'color' }}
              >
                no en 6 meses.
              </motion.span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: d(2.2) }}
          className="font-dm max-w-xl"
          style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(240,239,232,0.6)' }}
        >
          Renta espacio en tienda.{' '}
          <span style={{ color: LIME, fontWeight: 400 }}>Pago mensual</span>,{' '}
          <span style={{ color: ORANGE, fontWeight: 400 }}>sin meses de espera</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: d(2.3) }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <Link
            href="/registro-tienda"
            className="inline-flex items-center px-8 py-4 rounded-pill font-syne font-bold text-black text-base transition-all duration-200"
            style={{ background: '#E8FF47' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.88'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = ''
            }}
          >
            Tengo una tienda
          </Link>
          <Link
            href="/registro-productor"
            className="inline-flex items-center px-8 py-4 rounded-pill font-syne font-bold text-base transition-all duration-200"
            style={{ border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,53,0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = ''
            }}
          >
            Tengo una marca
          </Link>
        </motion.div>

        {/* Stats carousel — 4 cards rotating in parallel with 3-position offsets */}
        <motion.div
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full"
        >
          {CARD_OFFSETS.map((offset, cardIndex) => (
            <StatCard
              key={cardIndex}
              stat={STATS[(tick + offset) % STATS.length]}
              tick={tick}
              cardIndex={cardIndex}
            />
          ))}
        </motion.div>

        {/* Dots navigation — 12 dots, one per stat in the main card (offset 0) */}
        <motion.div
          custom={0.45}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex gap-1.5 flex-wrap justify-center mt-5"
          style={{ maxWidth: '220px' }}
        >
          {STATS.map((_, i) => {
            const isActive = i === activeDotIndex
            return (
              <button
                key={i}
                aria-label={`Estadística ${i + 1}`}
                onClick={() => {
                  if (timerRef.current)   clearInterval(timerRef.current)
                  if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  setTick(i)
                  timeoutRef.current = setTimeout(startAutoplay, 6000)
                }}
                className="inline-flex items-center justify-center"
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isActive ? activeColor : 'rgba(240,239,232,0.2)',
                    transform: isActive ? 'scale(1.4)' : 'scale(1)',
                    transition: 'background 0.3s ease, transform 0.2s ease',
                  }}
                />
              </button>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}
