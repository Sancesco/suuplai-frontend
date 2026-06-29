'use client'

import { useState } from 'react'
import { NavRegistro } from '@/components/registro/NavRegistro'
import { HeroStripTienda } from '@/components/registro/HeroStripTienda'
import { FormTienda } from '@/components/registro/FormTienda'
import { InfoSideTienda } from '@/components/registro/InfoSideTienda'
import { CalendarEmbed, CALENDAR_URL } from '@/components/registro/CalendarEmbed'

export default function RegistroTiendaPage() {
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      <NavRegistro tipo="tienda" />
      <HeroStripTienda />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          {/* Sticky form */}
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            <FormTienda onSuccess={() => setShowCalendar(true)} />
            <a
              href={CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-pill font-syne font-bold text-base text-center transition-all duration-200"
              style={{ border: '1.5px solid #E8FF47', color: '#0A0A0F', background: '#E8FF47' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              📅 Agendar una cita →
            </a>
          </div>
          {/* Info side */}
          <InfoSideTienda />
        </div>
      </main>

      {showCalendar && <CalendarEmbed tipo="tienda" />}
    </div>
  )
}
