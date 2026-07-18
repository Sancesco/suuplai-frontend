'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { NavRegistro } from '@/components/registro/NavRegistro'
import { HeroStripProductor } from '@/components/registro/HeroStripProductor'
import { FormProductor } from '@/components/registro/FormProductor'
import { InfoSideProductor } from '@/components/registro/InfoSideProductor'
import { CalendarEmbed, CALENDAR_URL } from '@/components/registro/CalendarEmbed'

const ACCENT = '#FF6B35'

const keyStats = [
  { number: '$3K', unit: 'MXN/mes', label: 'Costo de entrada vs $50K en cadena grande' },
  { number: '4', unit: 'marcas', label: 'por espacio — tu marca se destaca, no se pierde' },
  { number: '48h', unit: 'respuesta', label: 'Para responder a tu solicitud' },
  { number: '94%', unit: 'de ahorro', label: 'En costo de entrada vs retailers grandes' },
]

const steps = [
  {
    num: '01',
    title: 'Llena la solicitud',
    body: 'Cuéntanos sobre tu marca, tu producto y qué zonas de CDMX te interesan. Tarda menos de 5 minutos.',
  },
  {
    num: '02',
    title: 'Revisamos tu marca',
    body: 'Evaluamos producto, empaque, precio y fit con las tiendas disponibles. Confirmamos en 48h.',
  },
  {
    num: '03',
    title: 'Llamada de 20 minutos',
    body: 'Platicamos sobre tu estrategia, qué tiendas hacen más sentido y negociamos los términos del slot.',
  },
  {
    num: '04',
    title: 'Primer slot activo',
    body: 'Tu producto está en anaquel. Al mes recibes tu primer reporte de ventas y rotación por zona.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function RegistroProductorPage() {
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <NavRegistro tipo="productor" />
      <HeroStripProductor />

      {/* Form + Info side */}
      <main
        className="px-6 py-16"
        style={{ borderTop: '1px solid rgba(240,239,232,0.06)' }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <FormProductor onSuccess={() => setShowCalendar(true)} />
            <a
              href={CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-pill font-syne font-bold text-base text-center transition-all duration-200"
              style={{ border: '1.5px solid #FF6B35', color: '#0A0A0F', background: '#FF6B35' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              📅 Agendar una cita →
            </a>
          </div>
          <InfoSideProductor />
        </div>
      </main>

      {/* Stats strip */}
      <section
        className="py-16 px-6"
        style={{ borderTop: '1px solid rgba(240,239,232,0.06)' }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="font-dm font-medium text-center mb-10"
            style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(240,239,232,0.35)' }}
          >
            POR QUÉ SUUPLAI VS CADENAS GRANDES
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {keyStats.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="flex flex-col gap-2 p-7 rounded-card"
                style={{
                  background: '#13131A',
                  border: '1px solid rgba(240,239,232,0.07)',
                }}
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-syne font-extrabold"
                    style={{ fontSize: 'clamp(30px, 3.5vw, 42px)', color: ACCENT, lineHeight: 1 }}
                  >
                    {s.number}
                  </span>
                  <span
                    className="font-dm"
                    style={{ fontSize: '12px', color: 'rgba(240,239,232,0.45)', fontWeight: 300 }}
                  >
                    {s.unit}
                  </span>
                </div>
                <span
                  className="font-dm"
                  style={{ fontSize: '13px', color: 'rgba(240,239,232,0.5)', lineHeight: 1.5, fontWeight: 300 }}
                >
                  {s.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="py-20 px-6"
        style={{ borderTop: '1px solid rgba(240,239,232,0.06)' }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span
              className="font-dm font-medium block mb-4"
              style={{ fontSize: '10px', letterSpacing: '0.18em', color: ACCENT }}
            >
              EL PROCESO
            </span>
            <h2
              className="font-syne font-extrabold"
              style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', letterSpacing: '-1px', color: '#F0EFE8' }}
            >
              Del registro al anaquel en días.
            </h2>
            <p
              className="font-dm mt-4 max-w-lg mx-auto"
              style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.65, color: 'rgba(240,239,232,0.55)' }}
            >
              No meses de negociación ni slotting fees de entrada. El proceso es simple — porque
              lo diseñamos para marcas independientes.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {steps.map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="flex gap-5 p-7 rounded-card transition-colors duration-200"
                style={{
                  background: '#13131A',
                  border: '1px solid rgba(240,239,232,0.07)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(240,239,232,0.07)'
                }}
              >
                <span
                  className="font-syne font-extrabold shrink-0 mt-0.5"
                  style={{ fontSize: '13px', color: ACCENT, letterSpacing: '0.05em' }}
                >
                  {step.num}
                </span>
                <div className="flex flex-col gap-2">
                  <h3
                    className="font-syne font-bold"
                    style={{ fontSize: '17px', letterSpacing: '-0.3px', color: '#F0EFE8' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="font-dm"
                    style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(240,239,232,0.55)' }}
                  >
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="mt-14 text-center"
          >
            <p
              className="font-dm mb-6"
              style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(240,239,232,0.5)' }}
            >
              Los cupos son limitados. Abrimos nuevas tiendas cada mes en CDMX.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center px-8 py-4 rounded-pill font-syne font-bold text-base transition-all duration-200"
              style={{ background: ACCENT, color: '#0A0A0F', border: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Asegurar mi lugar ahora →
            </button>
          </motion.div>
        </div>
      </section>

      {showCalendar && <CalendarEmbed tipo="productor" />}
    </div>
  )
}
