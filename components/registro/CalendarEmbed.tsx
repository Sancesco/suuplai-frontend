'use client'

import { useEffect, useRef } from 'react'

interface CalendarEmbedProps {
  tipo: 'tienda' | 'productor'
}

export const CALENDAR_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3Kssu9keF31IHgk6oomsxJQ7H2gCEBrcClTD2wOfjupMHlBCZ26iXOjYnlFffsFxw0zsX6RHdV?gv=true'

export function CalendarEmbed({ tipo }: CalendarEmbedProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section
      ref={ref}
      className="py-16 px-6"
      style={{ background: '#0A0A0F', borderTop: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">📅</span>
          <div>
            <h2
              className="font-syne font-extrabold text-suu-text"
              style={{ fontSize: '24px', letterSpacing: '-0.5px' }}
            >
              Agenda tu llamada de 20 minutos
            </h2>
            <p className="font-dm text-suu-muted mt-1" style={{ fontSize: '15px', fontWeight: 300 }}>
              {tipo === 'tienda'
                ? 'Es el último paso para activar tu espacio.'
                : 'Platiquemos sobre tu producto y buscamos el primer slot.'}
            </p>
          </div>
        </div>

        {/* Iframe */}
        <div
          className="rounded-card overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <iframe
            src={CALENDAR_URL}
            width="100%"
            height="600"
            frameBorder="0"
            title="Agenda una llamada con Suuplai"
            style={{ background: 'white', display: 'block' }}
          />
        </div>
      </div>
    </section>
  )
}
