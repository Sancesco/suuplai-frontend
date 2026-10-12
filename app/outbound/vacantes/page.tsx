import type { Metadata } from 'next'
import { Vacantes } from './Vacantes'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Vacantes · Outbound', robots: { index: false, follow: false } }

export default function Page() {
  return <Vacantes />
}
