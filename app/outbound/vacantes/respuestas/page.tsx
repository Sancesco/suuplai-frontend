import type { Metadata } from 'next'
import { Respuestas } from './Respuestas'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Respuestas · Outbound', robots: { index: false, follow: false } }

export default function Page() {
  return <Respuestas />
}
