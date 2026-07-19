'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, animate, useReducedMotion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

type SlotStatus = 'active' | 'libre'

interface Slot {
  brand: string
  category: string
  color: string
  price: string
  priceNum: number
  status: SlotStatus
}

const SLOTS: Slot[] = [
  { brand: 'Bebidas frías',    category: 'Hidratación · Sports',  color: '#7FDBCA', price: '$500', priceNum: 500, status: 'active' },
  { brand: 'Snacks naturales', category: 'Alimentos · Healthy',   color: '#FFB347', price: '$700', priceNum: 700, status: 'active' },
  { brand: 'Cosmética natural',category: 'Cuidado personal',      color: '#C9A8E8', price: '$800', priceNum: 800, status: 'active' },
  { brand: 'Espacio libre',    category: 'Disponible para tu marca', color: 'transparent', price: '$800', priceNum: 800, status: 'libre' },
]

const MONTHLY_TOTAL = SLOTS.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.priceNum, 0)
const ANNUAL_TOTAL = MONTHLY_TOTAL * 12

const fmx = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const otherStats = [
  {
    label: 'INVERSIÓN PROPIA',
    value: '$0',
    note: 'Sin inventario, sin riesgo',
    accent: '#F0EFE8' as const,
  },
  {
    label: 'PROYECTADO ANUAL',
    value: fmx(ANNUAL_TOTAL),
    note: 'MXN · estimación referencial',
    accent: '#F0EFE8' as const,
  },
]

export function SlotVisual() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.3 })
  const prefersReducedMotion = useReducedMotion()
  const [filled, setFilled] = useState(false)
  const [displayValue, setDisplayValue] = useState<string>(fmx(0))

  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion) {
      setDisplayValue(fmx(MONTHLY_TOTAL))
      setFilled(true)
      return
    }
    const controls = animate(0, MONTHLY_TOTAL, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(fmx(Math.round(v))),
    })
    const fillTimer = window.setTimeout(() => setFilled(true), 500)
    return () => {
      controls.stop()
      window.clearTimeout(fillTimer)
    }
  }, [inView, prefersReducedMotion])

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6"
      style={{ background: '#0A0A0F', borderTop: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="font-dm font-medium block mb-3"
            style={{ color: '#E8FF47', fontSize: '12px', letterSpacing: '2px' }}
          >
            EL PRODUCTO
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="font-syne font-extrabold text-suu-text"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px', lineHeight: 1.1 }}
          >
            Así se ve un espacio
            <br />
            <span style={{ color: '#E8FF47' }}>en tu tienda.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-dm text-suu-muted mt-4 max-w-xl"
            style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.6 }}
          >
            Tu espacio libre dividido en lugares. Cada lugar es un acuerdo directo con una marca.
            Tú decides cuántos, con quién y a qué precio.
          </motion.p>
        </motion.div>

        {/* Shelf visual */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {/* Label */}
          <div className="flex items-center gap-3 mb-2 pl-1">
            <span className="font-dm text-suu-muted" style={{ fontSize: '11px', letterSpacing: '2px' }}>
              ESPACIO EJEMPLO · 4 LUGARES · 3M LINEALES
            </span>
          </div>

          {/* Shelf card */}
          <div
            className="rounded-card overflow-hidden mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#13131A' }}
          >
            {/* Top rail */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Slots grid */}
            <div className="grid grid-cols-2 md:grid-cols-4">
              {SLOTS.map((slot, i) => {
                const isLibre = slot.status === 'libre'
                const isFilled = isLibre && filled
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    animate={{
                      opacity: isLibre ? (isFilled ? 0.92 : 0.45) : 1,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="relative flex flex-col gap-3 p-5"
                    style={{
                      borderRight: i < SLOTS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      minHeight: '152px',
                    }}
                  >
                    {/* Slot number */}
                    <span
                      className="absolute top-3 right-4 font-syne font-extrabold"
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.12)',
                        fontFamily: 'var(--font-space-mono)',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Status dot, green when active, lime pulse when filled by user */}
                    {(slot.status === 'active' || isFilled) && (
                      <div
                        className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full"
                        style={{ background: isFilled ? '#E8FF47' : '#4CAF50' }}
                      />
                    )}

                    {/* Color bar */}
                    <div className="mt-3">
                      <motion.div
                        animate={{
                          background: isFilled
                            ? '#E8FF47'
                            : isLibre
                              ? 'rgba(255,255,255,0.08)'
                              : slot.color,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="rounded-sm"
                        style={{
                          width: '6px',
                          height: '36px',
                          border:
                            isLibre && !isFilled
                              ? '1px dashed rgba(255,255,255,0.15)'
                              : 'none',
                        }}
                      />
                    </div>

                    {/* Brand info */}
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="font-syne font-bold text-suu-text" style={{ fontSize: '13px' }}>
                        {isFilled ? 'Tu marca aquí' : slot.brand}
                      </span>
                      <span className="font-dm text-suu-muted" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                        {isFilled ? 'Reservado para tu producto' : slot.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-syne font-bold"
                        style={{
                          fontSize: '14px',
                          color: isLibre && !isFilled ? 'rgba(255,255,255,0.25)' : '#E8FF47',
                          fontFamily: 'var(--font-space-mono)',
                        }}
                      >
                        {slot.price}
                      </span>
                      <span className="font-dm text-suu-muted" style={{ fontSize: '10px' }}>
                        /mes
                      </span>
                    </div>

                    {/* Overlay for libre, swaps text when filled */}
                    {isLibre && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ pointerEvents: 'none' }}
                      >
                        <motion.span
                          animate={{
                            color: isFilled ? '#0A0A0F' : 'rgba(255,255,255,0.25)',
                            background: isFilled ? '#E8FF47' : '#13131A',
                            borderColor: isFilled ? '#E8FF47' : 'rgba(255,255,255,0.1)',
                          }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="font-dm font-medium"
                          style={{
                            fontSize: '10px',
                            letterSpacing: '2px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px dashed',
                          }}
                        >
                          {isFilled ? 'TU MARCA AQUÍ' : 'DISPONIBLE'}
                        </motion.span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Shelf footer */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4CAF50' }} />
                <span className="font-dm text-suu-muted" style={{ fontSize: '12px' }}>
                  3 de 4 espacios activos
                </span>
              </div>
              <span
                className="font-syne font-bold"
                style={{
                  fontSize: '15px',
                  color: '#E8FF47',
                  fontFamily: 'var(--font-space-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {displayValue}
                <span style={{ opacity: 0.7 }}> / mes</span>
              </span>
            </div>
          </div>

          {/* Stats row */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {/* INGRESO MENSUAL, count-up animado */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-2 p-5 rounded-card"
              style={{
                background: 'rgba(232,255,71,0.04)',
                border: '1px solid rgba(232,255,71,0.12)',
              }}
            >
              <span
                className="font-dm text-suu-muted"
                style={{ fontSize: '11px', letterSpacing: '1px' }}
              >
                INGRESO MENSUAL
              </span>
              <span
                className="font-syne font-extrabold"
                style={{
                  fontSize: '28px',
                  color: '#E8FF47',
                  fontFamily: 'var(--font-space-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {displayValue}
              </span>
              <span className="font-dm text-suu-muted" style={{ fontSize: '12px' }}>
                MXN · tarifa fija mensual
              </span>
            </motion.div>

            {otherStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="flex flex-col gap-2 p-5 rounded-card"
                style={{
                  background: '#13131A',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span
                  className="font-dm text-suu-muted"
                  style={{ fontSize: '11px', letterSpacing: '1px' }}
                >
                  {stat.label}
                </span>
                <span
                  className="font-syne font-extrabold"
                  style={{
                    fontSize: '28px',
                    color: stat.accent,
                    fontFamily: 'var(--font-space-mono)',
                  }}
                >
                  {stat.value}
                </span>
                <span className="font-dm text-suu-muted" style={{ fontSize: '12px' }}>
                  {stat.note}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <Link
              href="#calculadora"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-pill font-syne font-bold text-sm text-black transition-all duration-200"
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
              Calcular con tus números →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
