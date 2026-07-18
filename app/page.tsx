import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { CarruselTiendas } from '@/components/landing/CarruselTiendas'
import { MarcasSocias } from '@/components/landing/MarcasSocias'
import { MapaCDMX } from '@/components/landing/MapaCDMX'
import { MarqueeBanner } from '@/components/landing/MarqueeBanner'
import { PainPoints } from '@/components/landing/PainPoints'
import { AudienceSplit } from '@/components/landing/AudienceSplit'
import { DosServicios } from '@/components/landing/DosServicios'
import { SlotVisual } from '@/components/landing/SlotVisual'
import { OnboardingRapido } from '@/components/landing/OnboardingRapido'
import { Calculator } from '@/components/landing/Calculator'
import { Pricing } from '@/components/landing/Pricing'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'
import { WhatsAppFloat } from '@/components/landing/WhatsAppFloat'
import { StickyMobileCTA } from '@/components/landing/StickyMobileCTA'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <CarruselTiendas />
        <MarcasSocias />
        <DosServicios />
        <MapaCDMX />
        <MarqueeBanner />
        <PainPoints />
        <AudienceSplit />
        <SlotVisual />
        <OnboardingRapido />
        <Calculator id="calculadora" />
        <Pricing />
        <HowItWorks id="como-funciona" />
        <FAQ />
      </main>
      <Footer />
      {/* Mobile-only bottom padding so the sticky CTA never tapes el footer */}
      <div className="md:hidden" style={{ height: '80px' }} aria-hidden="true" />
      <WhatsAppFloat />
      <StickyMobileCTA />
    </>
  )
}
