import type { Metadata } from 'next'
import { Agenda } from './Agenda'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Agenda · Outbound', robots: { index: false, follow: false } }

export default function Page() {
  return <Agenda />
}
