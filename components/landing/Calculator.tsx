'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// ─── Slider Component ───────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  formatValue: (v: number) => string
  onChange: (v: number) => void
  accentColor: string
  sliderClass: string
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
  accentColor,
  sliderClass,
}: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-dm font-medium text-suu-text" style={{ fontSize: '14px' }}>
          {label}
        </span>
        <span className="font-syne font-bold text-sm" style={{ color: accentColor }}>
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderClass}
        style={
          {
            '--progress': `${progress}%`,
            accentColor,
            touchAction: 'none',
          } as React.CSSProperties
        }
      />
    </div>
  )
}

// ─── Tab Tienda ──────────────────────────────────────────────────────────────

const MODAL_LABELS = ['Tarifa fija', 'Mixta', 'Comisión']
const MODAL_MULTIPLIERS = [1.0, 1.25, 1.5]
const BASE_RATE = 600

function TabTienda() {
  const [metros, setMetros] = useState(3)
  const [marcas, setMarcas] = useState(2)
  const [modal, setModal] = useState(1)

  const multiplier = MODAL_MULTIPLIERS[modal - 1]
  const monthly = Math.round(metros * BASE_RATE * multiplier)
  const annual = monthly * 12
  const perMeter = Math.round(monthly / metros)
  const perBrand = Math.round(monthly / marcas)
  const barWidth = Math.min((monthly / 20000) * 100, 100)

  const formatMXN = (v: number) =>
    v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="flex flex-col gap-6">
          <SliderInput
            label="Metros lineales disponibles"
            value={metros}
            min={1}
            max={20}
            step={0.5}
            formatValue={(v) => `${v} metros`}
            onChange={setMetros}
            accentColor="#E8FF47"
            sliderClass="slider-tienda w-full"
          />
          <SliderInput
            label="Número de marcas en ese espacio"
            value={marcas}
            min={1}
            max={8}
            step={1}
            formatValue={(v) => `${v} marcas`}
            onChange={setMarcas}
            accentColor="#E8FF47"
            sliderClass="slider-tienda w-full"
          />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-dm font-medium text-suu-text" style={{ fontSize: '14px' }}>
                Modalidad de acuerdo
              </span>
              <span className="font-syne font-bold text-sm" style={{ color: '#E8FF47' }}>
                {MODAL_LABELS[modal - 1]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={modal}
              onChange={(e) => setModal(Number(e.target.value))}
              className="slider-tienda w-full"
              style={{ '--progress': `${((modal - 1) / 2) * 100}%`, accentColor: '#E8FF47', touchAction: 'none' } as React.CSSProperties}
            />
            <div className="flex justify-between">
              {MODAL_LABELS.map((l) => (
                <span key={l} className="font-dm text-suu-muted" style={{ fontSize: '11px' }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div
          className="flex flex-col gap-6 p-6 rounded-card"
          style={{
            background: '#0A0A0F',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div>
            <p className="font-dm text-suu-muted mb-1" style={{ fontSize: '13px', letterSpacing: '1px' }}>
              INGRESO MENSUAL ESTIMADO
            </p>
            <p
              className="font-syne font-extrabold"
              style={{
                fontSize: 'clamp(40px, 5vw, 64px)',
                color: '#E8FF47',
                fontFamily: 'var(--font-space-mono)',
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              {formatMXN(monthly)}
            </p>
            <p className="font-dm text-suu-muted text-sm mt-1">MXN / mes</p>
          </div>

          {/* Bar */}
          <div>
            <div className="h-1 w-full rounded-full" style={{ background: 'rgba(232,255,71,0.15)' }}>
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%`, background: '#E8FF47' }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: formatMXN(annual), label: 'al año', color: '#E8FF47' },
              { value: formatMXN(perMeter), label: 'por metro/mes', color: '#F0EFE8' },
              { value: formatMXN(perBrand), label: 'por marca/mes', color: '#F0EFE8' },
            ].map((item) => (
              <div key={item.label} className="flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-start gap-2 sm:gap-1">
                <span
                  className="font-syne font-bold"
                  style={{ fontSize: '15px', color: item.color }}
                >
                  {item.value}
                </span>
                <span className="font-dm text-suu-muted" style={{ fontSize: '12px' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="font-dm text-suu-muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>
            Estimación referencial · Los precios finales se acuerdan entre tienda y productor
          </p>
        </div>
      </div>

      {/* Contextual CTA */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-card"
        style={{ background: 'rgba(232,255,71,0.04)', border: '1px solid rgba(232,255,71,0.1)' }}
      >
        <p className="font-dm text-suu-muted" style={{ fontSize: '14px' }}>
          Tu espacio puede generar{' '}
          <span className="font-medium" style={{ color: '#E8FF47' }}>
            {formatMXN(monthly)} / mes
          </span>
          {' '}sin inventario propio
        </p>
        <Link
          href="/registro-tienda"
          className="inline-flex items-center px-6 py-2.5 rounded-pill font-syne font-bold text-sm text-black transition-all duration-200 shrink-0"
          style={{ background: '#E8FF47' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Asegurar mi lugar →
        </Link>
      </div>
    </>
  )
}

// ─── Tab Productor ───────────────────────────────────────────────────────────

const RETAILER_BENCHMARK = 50000

function TabProductor() {
  const [tiendas, setTiendas] = useState(5)
  const [precioSlot, setPrecioSlot] = useState(700)
  const [ventasTienda, setVentasTienda] = useState(20000)

  const monthlyCost = tiendas * precioSlot
  const monthlyRevenue = tiendas * ventasTienda
  const roi =
    monthlyCost > 0 ? Math.round(((monthlyRevenue - monthlyCost) / monthlyCost) * 100) : 0
  const profit = monthlyRevenue - monthlyCost
  const recoveryMonths = profit > 0 ? Math.ceil(monthlyCost / profit) : '—'
  const barSuuplai = Math.min((monthlyCost / RETAILER_BENCHMARK) * 100, 100)
  const barBenchmark = 100

  const formatMXN = (v: number) =>
    v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="flex flex-col gap-6">
          <SliderInput
            label="Número de tiendas donde entrar"
            value={tiendas}
            min={1}
            max={50}
            step={1}
            formatValue={(v) => `${v} tiendas`}
            onChange={setTiendas}
            accentColor="#FF6B35"
            sliderClass="slider-productor w-full"
          />
          <SliderInput
            label="Precio promedio por espacio/mes"
            value={precioSlot}
            min={300}
            max={2000}
            step={100}
            formatValue={(v) => `$${v.toLocaleString()} MXN`}
            onChange={setPrecioSlot}
            accentColor="#FF6B35"
            sliderClass="slider-productor w-full"
          />
          <SliderInput
            label="Ventas mensuales estimadas por tienda"
            value={ventasTienda}
            min={5000}
            max={100000}
            step={1000}
            formatValue={(v) => `$${v.toLocaleString()} MXN`}
            onChange={setVentasTienda}
            accentColor="#FF6B35"
            sliderClass="slider-productor w-full"
          />
        </div>

        {/* Result panel */}
        <div
          className="flex flex-col gap-6 p-6 rounded-card"
          style={{
            background: '#0A0A0F',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-dm text-suu-muted mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                COSTO MENSUAL
              </p>
              <p
                className="font-syne font-extrabold"
                style={{
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  color: '#FF6B35',
                  fontFamily: 'var(--font-space-mono)',
                }}
              >
                {formatMXN(monthlyCost)}
              </p>
            </div>
            <div>
              <p className="font-dm text-suu-muted mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                VENTAS PROYECTADAS
              </p>
              <p
                className="font-syne font-extrabold"
                style={{
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  color: '#F0EFE8',
                  fontFamily: 'var(--font-space-mono)',
                }}
              >
                {formatMXN(monthlyRevenue)}
              </p>
            </div>
          </div>

          {/* ROI comparison bars */}
          <div className="flex flex-col gap-3">
            <p className="font-dm text-suu-muted" style={{ fontSize: '12px', letterSpacing: '1px' }}>
              VS CADENA GRANDE
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="font-dm text-suu-muted w-24 shrink-0" style={{ fontSize: '11px' }}>
                  Cadena grande
                </span>
                <div className="flex-1 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-3 rounded-full"
                    style={{ width: `${barBenchmark}%`, background: 'rgba(255,107,53,0.3)' }}
                  />
                </div>
                <span className="font-mono text-suu-muted shrink-0" style={{ fontSize: '11px' }}>
                  $50K
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-dm text-suu-muted w-24 shrink-0" style={{ fontSize: '11px' }}>
                  Suuplai
                </span>
                <div className="flex-1 h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${barSuuplai}%`, background: '#FF6B35' }}
                  />
                </div>
                <span className="font-mono text-suu-muted shrink-0" style={{ fontSize: '11px' }}>
                  {formatMXN(monthlyCost)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-dm text-suu-muted mb-1" style={{ fontSize: '11px' }}>ROI mensual</p>
              <p className="font-syne font-bold" style={{ fontSize: '20px', color: roi >= 0 ? '#E8FF47' : '#FF6B35' }}>
                {roi}%
              </p>
            </div>
            <div>
              <p className="font-dm text-suu-muted mb-1" style={{ fontSize: '11px' }}>
                Meses para recuperar
              </p>
              <p
                className="font-syne font-bold"
                style={{ fontSize: '20px', color: '#E8FF47', fontFamily: 'var(--font-space-mono)' }}
              >
                {recoveryMonths}
              </p>
            </div>
          </div>

          <p className="font-dm text-suu-muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>
            El benchmark de cadena grande incluye costo de entrada, factoraje y logística CEDIS
          </p>
        </div>
      </div>

      {/* Contextual CTA */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-card"
        style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)' }}
      >
        <p className="font-dm text-suu-muted" style={{ fontSize: '14px' }}>
          <span className="font-medium" style={{ color: '#FF6B35' }}>
            {tiendas} {tiendas === 1 ? 'tienda' : 'tiendas'}
          </span>
          {' '}· proyectas {formatMXN(monthlyRevenue)} / mes
        </p>
        <Link
          href="/registro-productor"
          className="inline-flex items-center px-6 py-2.5 rounded-pill font-syne font-bold text-sm text-black transition-all duration-200 shrink-0"
          style={{ background: '#FF6B35' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Aplicar como productor →
        </Link>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Calculator({ id }: { id?: string }) {
  const [activeTab, setActiveTab] = useState<'tienda' | 'productor'>('tienda')

  return (
    <section id={id} className="py-24 px-6" style={{ background: '#13131A' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeUp}
          className="mb-10"
        >
          <span
            className="font-dm font-medium block mb-3"
            style={{ color: '#7A7A8A', fontSize: '12px', letterSpacing: '2px' }}
          >
            CALCULADORA
          </span>
          <h2
            className="font-syne font-extrabold text-suu-text"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-1.5px' }}
          >
            ¿Cuánto puedes ganar?
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('tienda')}
            className="px-6 py-3 rounded-pill font-syne font-bold text-sm transition-all duration-200"
            style={{
              background: activeTab === 'tienda' ? '#E8FF47' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'tienda' ? '#0A0A0F' : '#7A7A8A',
            }}
          >
            Soy tienda
          </button>
          <button
            onClick={() => setActiveTab('productor')}
            className="px-6 py-3 rounded-pill font-syne font-bold text-sm transition-all duration-200"
            style={{
              background: activeTab === 'productor' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'productor' ? '#0A0A0F' : '#7A7A8A',
            }}
          >
            Soy productor
          </button>
        </div>

        {activeTab === 'tienda' ? <TabTienda /> : <TabProductor />}
      </div>
    </section>
  )
}
