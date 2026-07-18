'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Logo } from '@/components/shared/Logo'
import { SimuladorComercial } from './SimuladorComercial'

// Paleta del prototipo
const VOID = '#0A0A0F'
const CARBON = '#14141b'
const LIME = '#E8FF47'
const EMBER = '#FF6B35'
const BONE = '#F0EFE8'
const ASH = '#8A8A94'
const LINE = '#26262f'

const CALENDAR_URL = 'https://calendar.app.google/LfAtSiFF7xAJ7YPx9'
// Si NEXT_PUBLIC_STRIPE_PAYMENT_LINK está vacío, el botón cae a la demo (no se pierde el prospecto).
const STRIPE_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || ''
const ARRANCAR_HREF = STRIPE_LINK || CALENDAR_URL

function Reveal({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  const reduce = useReducedMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.3, 1], delay } },
  }
  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

const wrap = 'max-w-[1200px] mx-auto px-5 md:px-8'

// ── Nav ───────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-8 py-4"
      style={{
        background: 'rgba(10,10,15,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <Logo variant="dark" className="h-6 md:h-7" />
      <div className="flex items-center gap-4 md:gap-6">
        <span
          className="font-mono hidden sm:inline"
          style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: ASH }}
        >
          Agente Comercial
        </span>
        <a
          href={CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-syne inline-flex items-center rounded-pill transition-transform"
          style={{ fontWeight: 700, fontSize: 14, background: LIME, color: VOID, padding: '9px 18px' }}
        >
          Reservar demo
        </a>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <header className="pt-14 md:pt-[72px] pb-14 md:pb-[60px]">
      <div className={`${wrap} grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-[54px] items-center`}>
        <Reveal>
          <div
            className="font-mono flex items-center gap-2.5"
            style={{ fontSize: 12.5, letterSpacing: '3px', textTransform: 'uppercase', color: EMBER, marginBottom: 22 }}
          >
            <span style={{ width: 26, height: 1, background: EMBER, display: 'inline-block' }} />
            Suuplai · Agente Comercial
          </div>
          <h1
            className="font-syne"
            style={{ fontWeight: 800, fontSize: 'clamp(38px, 5vw, 66px)', lineHeight: 1.02, letterSpacing: '-2px' }}
          >
            El equipo de ventas
            <br />
            que <span style={{ color: LIME }}>no tienes que
            <br />
            contratar</span>.
          </h1>
          <p style={{ fontSize: 18.5, color: '#C6C5BE', marginTop: 24, maxWidth: 460 }}>
            Prospectamos, tocamos puertas y salimos a vender tu marca en tiendas gourmet de México.
            Tú haces producto; nosotros abrimos cuentas.
          </p>
          <div className="flex flex-wrap gap-3.5 items-center" style={{ marginTop: 34 }}>
            <a
              href={CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-syne rounded-pill"
              style={{ fontWeight: 700, fontSize: 16, background: LIME, color: VOID, padding: '15px 26px' }}
            >
              Reservar demo
            </a>
            <a
              href="#como"
              className="font-syne rounded-pill"
              style={{ fontWeight: 700, fontSize: 16, color: BONE, padding: '15px 22px', border: `1px solid ${LINE}` }}
            >
              Cómo funciona
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <SimuladorComercial />
        </Reveal>
      </div>
    </header>
  )
}

// ── Problema / promesa ──────────────────────────────────────────────────────
function Problema() {
  const you = [
    'Sueldo, comisión y gasolina cada mes',
    'Meses hasta la primera venta',
    'Cero relaciones con compradores',
    'Tú gestionas, entrenas y persigues',
  ]
  const us = [
    'Ya tocamos puertas en la red gourmet de CDMX',
    'Muestras en mano desde la semana uno',
    'Prospección, cierre y seguimiento incluidos',
    'Reporte real: quién probó, quién pidió',
  ]
  return (
    <section className="py-16 md:py-[78px]">
      <div className={wrap}>
        <Reveal>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', color: EMBER, marginBottom: 16 }}>
            El problema real
          </div>
          <h2 className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(30px,3.6vw,46px)', lineHeight: 1.06, letterSpacing: '-1.4px' }}>
            Tu producto es bueno.
            <br />
            Llegar al <span style={{ color: LIME }}>anaquel</span> es el muro.
          </h2>
          <p style={{ fontSize: 19, color: '#C6C5BE', maxWidth: 640, marginTop: 18 }}>
            Montar un equipo comercial cuesta sueldos, comisiones, gasolina y meses de curva. La
            mayoría de las marcas nunca cruza ese muro. Nosotros ya estamos del otro lado.
          </p>
        </Reveal>

        <Reveal className="grid md:grid-cols-2 gap-5" style={{ marginTop: 44 }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: 28 }}>
            <div className="font-mono" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: ASH, marginBottom: 16 }}>
              Solo, desde cero
            </div>
            <h3 className="font-syne" style={{ fontWeight: 700, fontSize: 22, marginBottom: 14, lineHeight: 1.2 }}>
              Contratar un vendedor de calle
            </h3>
            <ContrastList items={you} color={ASH} mark="✕" />
          </div>
          <div
            style={{
              border: `1px solid rgba(232,255,71,.3)`,
              borderRadius: 16,
              padding: 28,
              background: 'linear-gradient(160deg, rgba(232,255,71,.06), transparent)',
            }}
          >
            <div className="font-mono" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: LIME, marginBottom: 16 }}>
              Con Suuplai
            </div>
            <h3 className="font-syne" style={{ fontWeight: 700, fontSize: 22, marginBottom: 14, lineHeight: 1.2 }}>
              Un motor que ya está corriendo
            </h3>
            <ContrastList items={us} color={LIME} mark="✓" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ContrastList({ items, color, mark }: { items: string[]; color: string; mark: string }) {
  return (
    <ul className="list-none">
      {items.map((t, i) => (
        <li
          key={t}
          className="flex gap-3"
          style={{
            padding: '9px 0',
            fontSize: 15.5,
            color: '#B4B3AC',
            borderBottom: i < items.length - 1 ? `1px solid ${LINE}` : 'none',
          }}
        >
          <span style={{ color, fontWeight: 700 }}>{mark}</span>
          {t}
        </li>
      ))}
    </ul>
  )
}

// ── Proceso ─────────────────────────────────────────────────────────────────
function Proceso() {
  const steps = [
    { n: '01', name: 'Curamos', desc: 'Elegimos las tiendas afines a tu marca, zona por zona. No disparamos al azar: cada punto encaja con tu producto y tu cliente.' },
    { n: '02', name: 'Muestreamos', desc: 'Entregamos muestra en mano directo al comprador. La convicción la genera tu producto en su paladar, no un discurso.' },
    { n: '03', name: 'Damos seguimiento', desc: '¿Probó? ¿Le gustó? ¿Pidió precios? Empujamos cada cuenta hasta el pedido y te reportamos el avance real por tienda.' },
    { n: '04', name: 'Entramos', desc: 'Cerramos el primer pedido, surtimos y monitoreamos la rotación para la recompra. Tu marca queda en anaquel, generando.' },
  ]
  return (
    <section id="como" className="py-16 md:py-[78px]">
      <div className={wrap}>
        <Reveal>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', color: EMBER, marginBottom: 16 }}>
            Cómo funciona
          </div>
          <h2 className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(30px,3.6vw,46px)', lineHeight: 1.06, letterSpacing: '-1.4px' }}>
            Cuatro pasos. De la <span style={{ color: LIME }}>muestra</span>
            <br />
            al anaquel.
          </h2>
        </Reveal>
        <Reveal style={{ marginTop: 44, borderTop: `1px solid ${LINE}` }}>
          {steps.map((s) => (
            <div
              key={s.n}
              className="grid grid-cols-[44px_1fr] md:grid-cols-[80px_210px_1fr] gap-4 md:gap-7 items-start"
              style={{ padding: '26px 0', borderBottom: `1px solid ${LINE}` }}
            >
              <div className="font-mono" style={{ fontSize: 14, color: EMBER, paddingTop: 5 }}>
                {s.n}
              </div>
              <div className="font-syne" style={{ fontWeight: 700, fontSize: 22 }}>
                {s.name}
              </div>
              <div className="col-span-2 md:col-span-1" style={{ fontSize: 16, color: '#B4B3AC', paddingTop: 2 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

// ── Retorno ──────────────────────────────────────────────────────────────────
function Retorno() {
  return (
    <section className="py-16 md:py-[78px]">
      <div className={wrap}>
        <Reveal style={{ background: CARBON, borderRadius: 24, padding: '32px 24px', border: `1px solid ${LINE}` }}>
          <div className="md:p-5">
            <div className="font-mono" style={{ fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', color: EMBER, marginBottom: 16 }}>
              El retorno
            </div>
            <h2 className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(30px,3.6vw,46px)', lineHeight: 1.06, letterSpacing: '-1.4px' }}>
              Una tienda recurrente y
              <br />
              el servicio <span style={{ color: LIME }}>se paga solo</span>.
            </h2>
            <p style={{ fontSize: 19, color: '#C6C5BE', maxWidth: 640, marginTop: 18 }}>
              Basta con que una sola tienda empiece a pedirte de forma recurrente para que el margen
              de esa cuenta cubra el costo del mes. De ahí en adelante, cada punto nuevo que abrimos
              es crecimiento neto.
            </p>
            <div className="flex flex-wrap items-center gap-5 md:gap-[22px]" style={{ marginTop: 38 }}>
              <RoiItem n="1" l="tienda que te recompra cada mes" />
              <RoiOp>cubre</RoiOp>
              <RoiItem n="$3,000" l="+ IVA · el costo mensual del servicio" />
              <RoiOp>y de ahí</RoiOp>
              <RoiItem n="neto" l="todo lo que sigue sumando" ember />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function RoiItem({ n, l, ember }: { n: string; l: string; ember?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div
        className="font-syne"
        style={{ fontWeight: 800, fontSize: 'clamp(32px,3.6vw,46px)', color: ember ? EMBER : LIME, lineHeight: 1, letterSpacing: '-1.5px' }}
      >
        {n}
      </div>
      <div style={{ fontSize: 14, color: ASH, marginTop: 12, lineHeight: 1.4 }}>{l}</div>
    </div>
  )
}

function RoiOp({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono" style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: '#5a5a63', paddingTop: 6 }}>
      {children}
    </div>
  )
}

// ── Precio ───────────────────────────────────────────────────────────────────
function Precio() {
  const incl = [
    'Prospección de tiendas afines por zona',
    'Muestreo y gestión con el comprador',
    'Seguimiento hasta cerrar el pedido',
    'Reporte de avance real por punto',
  ]
  return (
    <section className="py-16 md:py-[78px]">
      <div className={wrap}>
        <Reveal>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', color: EMBER, marginBottom: 16 }}>
            Inversión
          </div>
          <h2 className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(30px,3.6vw,46px)', lineHeight: 1.06, letterSpacing: '-1.4px' }}>
            Sin comisiones. <span style={{ color: LIME }}>Sin letra chica.</span>
          </h2>
        </Reveal>
        <Reveal className="grid md:grid-cols-[1.3fr_1fr] overflow-hidden" style={{ marginTop: 44, border: `1px solid ${LINE}`, borderRadius: 22 }}>
          <div style={{ padding: 36, background: 'linear-gradient(160deg, rgba(255,107,53,.06), transparent)' }}>
            <div className="font-mono" style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: EMBER, marginBottom: 18 }}>
              Agente comercial · mensual
            </div>
            <div className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(48px,7vw,64px)', lineHeight: 1, letterSpacing: '-2px' }}>
              $3,000<span style={{ fontSize: 26, color: ASH }}> + IVA</span>
            </div>
            <p style={{ fontSize: 15, color: '#B4B3AC', marginTop: 16, maxWidth: 320 }}>
              Una tarifa fija al mes. Sin comisión sobre lo que vendas: cada peso que rota en tienda
              es tuyo. Cancelable — sin contrato forzoso.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3.5" style={{ padding: 36, borderTop: `1px solid ${LINE}` }}>
            {incl.map((t) => (
              <div key={t} className="flex gap-3 items-baseline" style={{ fontSize: 15.5, color: '#CFCEC7' }}>
                <span style={{ color: LIME, fontWeight: 700 }}>✓</span>
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── CTA final ────────────────────────────────────────────────────────────────
function Final() {
  return (
    <section id="contacto" className="text-center pt-[90px] pb-10">
      <div className={wrap}>
        <Reveal>
          <h2 className="font-syne" style={{ fontWeight: 800, fontSize: 'clamp(34px,4.5vw,58px)', lineHeight: 1.04, letterSpacing: '-1.6px' }}>
            Tu marca ya está lista.
            <br />
            Falta el <span style={{ color: LIME }}>anaquel</span>.
          </h2>
        </Reveal>
        <Reveal>
          <p style={{ fontSize: 19, color: '#C6C5BE', marginTop: 18 }}>
            Reserva una demo de 20 minutos, o arranca hoy mismo.
          </p>
        </Reveal>
        <Reveal className="flex flex-wrap gap-3.5 justify-center" style={{ marginTop: 34 }}>
          <a
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-syne rounded-pill inline-block"
            style={{ fontWeight: 700, fontSize: 18, background: LIME, color: VOID, padding: '17px 34px' }}
          >
            Reservar demo
          </a>
          <a
            href={ARRANCAR_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-syne rounded-pill"
            style={{ fontWeight: 700, fontSize: 18, color: BONE, padding: '17px 30px', border: `1px solid ${LINE}` }}
          >
            Arrancar ahora · $3,000 + IVA
          </a>
        </Reveal>
        <Reveal>
          <div className="font-mono" style={{ fontSize: 14, color: ASH, letterSpacing: '1px', marginTop: 28 }}>
            55 8549 6699 &nbsp;·&nbsp;{' '}
            <a href="mailto:hola@suups.com.mx" style={{ color: BONE, textDecoration: 'none', borderBottom: `1px solid ${LINE}` }}>
              hola@suups.com.mx
            </a>{' '}
            &nbsp;·&nbsp; suuplai.com.mx
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FooterAgente() {
  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, padding: '30px 0', marginTop: 60 }}>
      <div className={`${wrap} flex justify-between items-center`} style={{ fontSize: 13, color: ASH }}>
        <Logo variant="dark" className="h-5" />
        <div>Inteligencia comercial · Retail B2B</div>
      </div>
    </footer>
  )
}

export function AgenteComercial() {
  return (
    <div style={{ background: VOID, color: BONE, overflowX: 'hidden' }}>
      <Nav />
      <Hero />
      <Problema />
      <Proceso />
      <Retorno />
      <Precio />
      <Final />
      <FooterAgente />
    </div>
  )
}
