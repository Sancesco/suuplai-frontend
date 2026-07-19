'use client'

import { motion } from 'framer-motion'

const ACCENT = '#FF6B35'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const benefits = [
  'Sabes en qué colonia rota mejor tu producto, en semanas, no en trimestres',
  'Conoces el perfil real de tu comprador, no solo cuánto vendiste',
  'Pruebas un SKU nuevo en 5 tiendas antes de apostar producción masiva',
  'Máximo 30 productos por tienda, tu marca tiene protagonismo, no compite con 200',
  'Logística simple: envío directo a tienda, sin CEDIS ni paletizado',
  'Sin slotting fee inicial, pagas solo cuando hay slot activo',
]

const curationSteps = [
  { num: '01', text: 'Recibimos tu solicitud y la revisamos en 48h' },
  { num: '02', text: 'Evaluamos producto, empaque, historia y fit con las tiendas' },
  { num: '03', text: 'Si hay fit, agendamos llamada y buscamos el primer slot' },
  { num: '04', text: 'Primer slot activo en días. Reporte de ventas al mes.' },
]

export function InfoSideProductor() {
  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-4"
    >
      {/* Card 1: Por qué Suuplai */}
      <motion.div
        variants={fadeUp}
        className="rounded-card p-8"
        style={{
          background: '#13131A',
          border: '1px solid rgba(240,239,232,0.08)',
        }}
      >
        <span
          className="font-dm font-medium block mb-3"
          style={{ color: ACCENT, fontSize: '10px', letterSpacing: '0.18em' }}
        >
          ¿POR QUÉ SUUPLAI?
        </span>
        <h3
          className="font-syne font-bold mb-6"
          style={{ fontSize: '18px', letterSpacing: '-0.3px', color: '#F0EFE8' }}
        >
          Lo que ningún retailer grande te da.
        </h3>
        <ul className="flex flex-col gap-3.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                style={{ background: ACCENT }}
              />
              <span
                className="font-dm"
                style={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 300, color: 'rgba(240,239,232,0.7)' }}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 2: Cost comparison */}
      <motion.div
        variants={fadeUp}
        className="rounded-card p-8"
        style={{
          background: '#0A0A0F',
          border: '1px solid rgba(240,239,232,0.08)',
        }}
      >
        <span
          className="font-dm font-medium block mb-3"
          style={{ color: ACCENT, fontSize: '10px', letterSpacing: '0.18em' }}
        >
          COSTO REAL VS CADENA GRANDE
        </span>
        <p
          className="font-syne font-bold mb-5"
          style={{ fontSize: '17px', color: '#F0EFE8' }}
        >
          El mismo anaquel. Sin el precio que mata.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Cadena grande */}
          <div
            className="rounded-card p-4 flex flex-col gap-1"
            style={{
              background: '#13131A',
              border: '1px solid rgba(240,239,232,0.07)',
            }}
          >
            <span
              className="font-dm font-medium"
              style={{ fontSize: '10px', color: 'rgba(240,239,232,0.35)', letterSpacing: '0.12em' }}
            >
              CADENA GRANDE
            </span>
            <p
              className="font-syne font-extrabold"
              style={{ fontSize: '28px', color: 'rgba(240,239,232,0.35)' }}
            >
              $50K
            </p>
            <p
              className="font-dm"
              style={{ fontSize: '11px', color: 'rgba(240,239,232,0.35)', fontWeight: 300, lineHeight: 1.5 }}
            >
              MXN/mes + 3–6 meses espera + factoraje
            </p>
          </div>
          {/* Suuplai */}
          <div
            className="rounded-card p-4 flex flex-col gap-1"
            style={{
              background: '#13131A',
              border: `1px solid rgba(255,107,53,0.35)`,
            }}
          >
            <span
              className="font-dm font-medium"
              style={{ fontSize: '10px', color: ACCENT, letterSpacing: '0.12em' }}
            >
              SUUPLAI
            </span>
            <p
              className="font-syne font-extrabold"
              style={{ fontSize: '28px', color: ACCENT }}
            >
              $3K
            </p>
            <p
              className="font-dm"
              style={{ fontSize: '11px', color: 'rgba(240,239,232,0.5)', fontWeight: 300, lineHeight: 1.5 }}
            >
              MXN/mes · activo en días · sin inventario masivo
            </p>
          </div>
        </div>
        <div className="mt-5 text-center">
          <span
            className="font-syne font-extrabold"
            style={{ fontSize: '18px', color: ACCENT }}
          >
            94% de ahorro en costo de entrada
          </span>
        </div>
      </motion.div>

      {/* Card 3: Curation process */}
      <motion.div
        variants={fadeUp}
        className="rounded-card p-8"
        style={{
          background: '#0A0A0F',
          border: '1px solid rgba(240,239,232,0.08)',
        }}
      >
        <span
          className="font-dm font-medium block mb-3"
          style={{ color: ACCENT, fontSize: '10px', letterSpacing: '0.18em' }}
        >
          EL PROCESO DE CURADURÍA
        </span>
        <p
          className="font-syne font-bold mb-5"
          style={{ fontSize: '17px', color: '#F0EFE8' }}
        >
          No cualquier marca entra.
        </p>
        <ol className="flex flex-col gap-4">
          {curationSteps.map((step) => (
            <li key={step.num} className="flex items-start gap-3">
              <span
                className="font-dm font-medium shrink-0"
                style={{ fontSize: '12px', color: ACCENT, letterSpacing: '0.05em', marginTop: '1px' }}
              >
                {step.num} →
              </span>
              <span
                className="font-dm"
                style={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 300, color: 'rgba(240,239,232,0.7)' }}
              >
                {step.text}
              </span>
            </li>
          ))}
        </ol>
        <p
          className="font-dm mt-5 pt-5"
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'rgba(240,239,232,0.3)',
            borderTop: '1px solid rgba(240,239,232,0.08)',
            fontWeight: 300,
          }}
        >
          Que haya filtro no es un obstáculo, es tu ventaja. Significa que si entras, tu marca no
          compite con ruido.
        </p>
      </motion.div>
    </motion.aside>
  )
}
