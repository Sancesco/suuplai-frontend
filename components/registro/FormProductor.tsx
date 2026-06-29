'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { saveRegistro } from '@/lib/saveRegistro'

const ACCENT = '#FF6B35'
const ACCENT_TEXT = '#0A0A0F'

interface FormData {
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  nombreMarca: string
  categoria: string
  skus: string
  ticket: string
  canalesVenta: string[]
  frustracion: string
  numTiendas: string
  zona: string
  descripcion: string
  instagram: string
}

const INITIAL: FormData = {
  nombre: '', apellido: '', email: '', whatsapp: '',
  nombreMarca: '', categoria: '', skus: '', ticket: '',
  canalesVenta: [],
  frustracion: '',
  numTiendas: '', zona: '',
  descripcion: '', instagram: '',
}

const CANALES = [
  'Instagram / TikTok',
  'E-commerce propio',
  'Mercado Libre / Amazon',
  'Tiendas independientes',
  'Cadenas grandes',
  'Mercados / bazares',
]

const CATEGORIAS = [
  'Alimentos y bebidas',
  'Salsas/condimentos',
  'Snacks/botanas',
  'Bebidas funcionales',
  'Cosméticos y skincare',
  'Wellness y suplementos',
  'Moda y accesorios',
  'Libros y papelería',
  'Arte y diseño',
  'Otro',
]

const FRUSTRACIONES = [
  'Slotting fees y barreras de entrada altísimas',
  'No tengo datos de quién me compra ni dónde roto mejor',
  'Mi margen se destruye con logística y penalizaciones',
  'Tardo meses en entrar y años en ver resultados',
  'Me pierdo entre cientos de productos similares',
  'No puedo testear SKUs nuevos sin arriesgar mucho',
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-dm font-medium" style={{ fontSize: '13px', color: '#F0EFE8' }}>
        {label}{required && <span style={{ color: ACCENT }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <span
        className="font-dm font-medium shrink-0"
        style={{ fontSize: '10px', letterSpacing: '0.18em', color: ACCENT }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,107,53,0.25)' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input styles — campos claros (fondo blanco), igual que el form de tienda.
// ─────────────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  padding: '12px 16px',
  fontFamily: 'var(--font-dm-sans)',
  fontWeight: 400,
  fontSize: '14px',
  color: '#1a1a1a',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

function onFocusOrange(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = ACCENT
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.25)'
}
function onBlurReset(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
  e.currentTarget.style.boxShadow = 'none'
}

// Selector de botones (chips) — más rápido y visual que un menú desplegable.
function ChoiceGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="font-dm transition-all duration-150"
            style={{
              fontSize: '13px',
              fontWeight: selected ? 600 : 400,
              padding: '9px 15px',
              borderRadius: '999px',
              cursor: 'pointer',
              background: selected ? ACCENT : '#FFFFFF',
              color: selected ? ACCENT_TEXT : '#3a3a3a',
              border: selected ? `1.5px solid ${ACCENT}` : '1.5px solid rgba(0,0,0,0.14)',
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// Lista vertical de opciones largas (frases) — botones full-width, fáciles de tocar.
function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const selected = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="flex items-center gap-3 px-4 py-3 text-left font-dm transition-all duration-150"
            style={{
              fontSize: '13px',
              lineHeight: 1.4,
              fontWeight: selected ? 500 : 400,
              borderRadius: '10px',
              cursor: 'pointer',
              background: selected ? 'rgba(255,107,53,0.12)' : '#FFFFFF',
              color: selected ? '#1a1a1a' : '#3a3a3a',
              border: selected ? `1.5px solid ${ACCENT}` : '1.5px solid rgba(0,0,0,0.12)',
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
            }}
          >
            <span
              className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all"
              style={{
                background: selected ? ACCENT : 'transparent',
                border: `1.5px solid ${selected ? ACCENT : 'rgba(0,0,0,0.25)'}`,
              }}
            >
              {selected && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />
              )}
            </span>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function FormProductor({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const loading = submitState === 'loading'

  const update =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const setField =
    (key: keyof FormData) =>
    (value: string) =>
      setForm((f) => ({ ...f, [key]: value }))

  const toggleCanal = (canal: string) => {
    setForm((f) => ({
      ...f,
      canalesVenta: f.canalesVenta.includes(canal)
        ? f.canalesVenta.filter((c) => c !== canal)
        : [...f.canalesVenta, canal],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('loading')
    setErrorMsg(null)
    void (async () => {
      const minLoadingDelay = new Promise<void>((r) => setTimeout(r, 800))
      try {
        await minLoadingDelay
        const existing = JSON.parse(localStorage.getItem('suuplai_registros') || '[]') as unknown[]
        localStorage.setItem(
          'suuplai_registros',
          JSON.stringify([...existing, { tipo: 'productor', timestamp: Date.now(), ...form }])
        )
        await saveRegistro({ tipo: 'productor', ...form })
        setSubmitState('success')
        setSubmitted(true)
        onSuccess()
      } catch (err) {
        setSubmitState('error')
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'No pudimos enviar tu registro. Intenta de nuevo en unos segundos.'
        )
      }
    })()
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-6 py-20 text-center px-8 rounded-card"
          style={{
            background: '#13131A',
            border: '1px solid rgba(240,239,232,0.08)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)' }}
          >
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
              <path d="M2 11L10 19L26 3" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2
            className="font-syne font-extrabold"
            style={{ fontSize: '28px', color: ACCENT, letterSpacing: '-0.5px' }}
          >
            ¡Estás en la waitlist!
          </h2>
          <p
            className="font-dm max-w-sm"
            style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(240,239,232,0.7)' }}
          >
            Revisamos tu marca en menos de 48h. Si hay fit, agendamos una llamada de 20 minutos
            para activar tu primer slot.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 md:p-12 rounded-card"
          style={{
            background: '#13131A',
            border: '1px solid rgba(240,239,232,0.08)',
          }}
        >
          <h2
            className="font-syne font-extrabold mb-2"
            style={{ fontSize: '28px', letterSpacing: '-0.5px', color: '#F0EFE8' }}
          >
            Únete a la waitlist
          </h2>
          <p
            className="font-dm mb-8"
            style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(240,239,232,0.55)' }}
          >
            Cuéntanos sobre tu marca. La mayoría son toques rápidos — confirmamos tu lugar en menos
            de 48h.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Divider label="DATOS DE CONTACTO" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={update('nombre')}
                  required
                  placeholder="Tu nombre"
                  style={inputBase}
                  onFocus={onFocusOrange}
                  onBlur={onBlurReset}
                />
              </Field>
              <Field label="Apellido" required>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={update('apellido')}
                  required
                  placeholder="Tu apellido"
                  style={inputBase}
                  onFocus={onFocusOrange}
                  onBlur={onBlurReset}
                />
              </Field>
            </div>

            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="tu@email.com"
                style={inputBase}
                onFocus={onFocusOrange}
                onBlur={onBlurReset}
              />
            </Field>

            <Field label="WhatsApp" required>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={update('whatsapp')}
                required
                placeholder="+52 55 1234 5678"
                style={inputBase}
                onFocus={onFocusOrange}
                onBlur={onBlurReset}
              />
            </Field>

            <Divider label="TU MARCA" />

            <Field label="Nombre de tu marca" required>
              <input
                type="text"
                value={form.nombreMarca}
                onChange={update('nombreMarca')}
                required
                placeholder="El nombre de tu marca"
                style={inputBase}
                onFocus={onFocusOrange}
                onBlur={onBlurReset}
              />
            </Field>

            <Field label="Categoría principal" required>
              <ChoiceGroup
                value={form.categoria}
                onChange={setField('categoria')}
                options={CATEGORIAS}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="¿Cuántos SKUs tienes activos?">
                <ChoiceGroup
                  value={form.skus}
                  onChange={setField('skus')}
                  options={['1–3', '4–10', '11–20', 'Más de 20']}
                />
              </Field>
              <Field label="Precio / ticket promedio">
                <ChoiceGroup
                  value={form.ticket}
                  onChange={setField('ticket')}
                  options={['Menos de $50', '$50–$150', '$150–$350', '$350–$800', 'Más de $800']}
                />
              </Field>
            </div>

            <Divider label="TU SITUACIÓN ACTUAL" />

            {/* Canales de venta — multi-selección con chips claros */}
            <Field label="¿Dónde vendes actualmente?">
              <div className="grid grid-cols-2 gap-2 mt-1">
                {CANALES.map((canal) => {
                  const checked = form.canalesVenta.includes(canal)
                  return (
                    <button
                      key={canal}
                      type="button"
                      onClick={() => toggleCanal(canal)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-card text-left transition-all duration-150"
                      style={{
                        background: checked ? 'rgba(255,107,53,0.12)' : '#FFFFFF',
                        border: `1.5px solid ${checked ? ACCENT : 'rgba(0,0,0,0.12)'}`,
                        color: checked ? '#1a1a1a' : '#3a3a3a',
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: checked ? ACCENT : 'transparent',
                          border: `1.5px solid ${checked ? ACCENT : 'rgba(0,0,0,0.25)'}`,
                        }}
                      >
                        {checked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="font-dm" style={{ fontSize: '13px' }}>{canal}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="¿Cuál es tu principal frustración con el retail actual?">
              <ChoiceList
                value={form.frustracion}
                onChange={setField('frustracion')}
                options={FRUSTRACIONES}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="¿En cuántas tiendas quieres entrar?">
                <ChoiceGroup
                  value={form.numTiendas}
                  onChange={setField('numTiendas')}
                  options={['1–3 (prueba)', '4–10', '11–20', '20+']}
                />
              </Field>
              <Field label="¿En qué zona de CDMX?">
                <ChoiceGroup
                  value={form.zona}
                  onChange={setField('zona')}
                  options={[
                    'Roma/Condesa',
                    'Polanco/Lomas',
                    'Coyoacán/Del Valle',
                    'Santa Fe/Interlomas',
                    'Narvarte/Doctores',
                    'Toda la ciudad',
                  ]}
                />
              </Field>
            </div>

            <Field label="Cuéntanos sobre tu producto" required>
              <textarea
                value={form.descripcion}
                onChange={update('descripcion')}
                required
                rows={4}
                placeholder="¿Qué lo hace especial? ¿Quién es tu cliente típico? ¿Por qué encajaría en Suuplai?"
                style={{ ...inputBase, resize: 'vertical' }}
                onFocus={onFocusOrange}
                onBlur={onBlurReset}
              />
            </Field>

            <Field label="Instagram o sitio web de tu marca">
              <input
                type="url"
                value={form.instagram}
                onChange={update('instagram')}
                placeholder="https://instagram.com/tumarca"
                style={inputBase}
                onFocus={onFocusOrange}
                onBlur={onBlurReset}
              />
            </Field>

            {/* Error banner */}
            {submitState === 'error' && errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 px-4 py-3 rounded-card"
                style={{
                  background: 'rgba(220,53,69,0.12)',
                  border: '1px solid rgba(220,53,69,0.4)',
                  color: '#F0EFE8',
                }}
              >
                <AlertCircle size={18} style={{ color: '#FF6B35', flexShrink: 0, marginTop: '2px' }} />
                <div className="flex-1">
                  <p className="font-dm font-medium" style={{ fontSize: '13px' }}>
                    {errorMsg}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitState('idle')
                      setErrorMsg(null)
                    }}
                    className="font-dm underline cursor-pointer mt-1"
                    style={{
                      fontSize: '12px',
                      color: ACCENT,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-4 rounded-pill font-syne font-bold text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{
                  background: submitState === 'success' ? '#4CAF50' : ACCENT,
                  color: submitState === 'success' ? '#fff' : '#0A0A0F',
                  border: 'none',
                }}
                onMouseEnter={(e) => { if (!loading && submitState === 'idle') e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                {submitState === 'loading' && (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando tu lugar...
                  </>
                )}
                {submitState === 'success' && (
                  <>
                    <Check size={18} strokeWidth={3} />
                    ¡Listo!
                  </>
                )}
                {(submitState === 'idle' || submitState === 'error') && (
                  <>Asegurar mi lugar en la waitlist →</>
                )}
              </button>
              <p
                className="font-dm text-center"
                style={{ fontSize: '11px', color: 'rgba(240,239,232,0.35)' }}
              >
                Sin costo. Cupos limitados. Confirmamos tu lugar en menos de 48h.
              </p>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
