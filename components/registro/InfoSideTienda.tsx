'use client'

import { motion } from 'framer-motion'

const ACCENT = '#E8FF47'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const steps = [
  'Registras tu tienda y nos cuentas qué espacio tienes disponible',
  'Revisamos tu perfil y te hacemos match con marcas curadas de tu categoría',
  'Recibes propuestas con términos claros: precio fijo, comisión o combinación',
  'Aceptas, la marca envía su producto y activamos el slot',
  'Cobras puntual cada mes, sin perseguir a nadie',
]

const casoBullets = [
  '20 puntos activos en CDMX',
  '$164,000 MXN proyectados/mes',
  '4 marcas por sucursal · visibilidad real en anaquel',
  'Reporte mensual de ventas incluido',
]

export function InfoSideTienda() {
  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-4"
    >
      {/* Card 1: How it works */}
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
          ¿CÓMO FUNCIONA?
        </span>
        <h3
          className="font-syne font-bold mb-6"
          style={{ fontSize: '18px', letterSpacing: '-0.3px', color: '#F0EFE8' }}
        >
          Simple, transparente y sin riesgo.
        </h3>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="font-syne font-bold shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: ACCENT, color: '#0A0A0F', fontSize: '11px', marginTop: '1px' }}
              >
                {i + 1}
              </span>
              <span
                className="font-dm"
                style={{ fontSize: '14px', lineHeight: 1.6, fontWeight: 300, color: 'rgba(240,239,232,0.7)' }}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Card 2: Income estimate */}
      <motion.div
        variants={fadeUp}
        className="rounded-card p-8"
        style={{
          background: '#0A0A0F',
          border: '1px solid rgba(232,255,71,0.12)',
        }}
      >
        <span
          className="font-dm font-medium block mb-3"
          style={{ color: ACCENT, fontSize: '10px', letterSpacing: '0.18em' }}
        >
          TU INGRESO ESTIMADO
        </span>
        <p
          className="font-dm mb-2"
          style={{ fontSize: '14px', color: 'rgba(240,239,232,0.5)', fontWeight: 300 }}
        >
          Con 3 metros lineales:
        </p>
        <p
          className="font-syne font-extrabold mb-1"
          style={{ fontSize: '48px', color: ACCENT, letterSpacing: '-1px', lineHeight: 1 }}
        >
          $5,400
        </p>
        <p
          className="font-dm mb-4"
          style={{ fontSize: '12px', color: 'rgba(240,239,232,0.4)', fontWeight: 300 }}
        >
          MXN / mes · con 70% de ocupación
        </p>
        <p
          className="font-dm"
          style={{ fontSize: '12px', lineHeight: 1.6, color: 'rgba(240,239,232,0.35)', fontWeight: 300 }}
        >
          Ingreso fijo por espacio + comisión sobre ventas. Sin inventario, sin riesgo.
        </p>
      </motion.div>

      {/* Card 3: Caso activo */}
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
          style={{ color: 'rgba(240,239,232,0.35)', fontSize: '10px', letterSpacing: '0.18em' }}
        >
          YA OPERANDO EN CDMX
        </span>
        <p
          className="font-syne font-bold mb-5"
          style={{ fontSize: '16px', color: '#F0EFE8' }}
        >
          Cliente activo · CDMX · Sector fitness
        </p>
        <ul className="flex flex-col gap-2.5">
          {casoBullets.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                style={{ background: ACCENT }}
              />
              <span
                className="font-dm"
                style={{ fontSize: '13px', color: 'rgba(240,239,232,0.65)', fontWeight: 300, lineHeight: 1.5 }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.aside>
  )
}
