import type { Metadata } from 'next'
import { Outbound } from './Outbound'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Outbound', robots: { index: false, follow: false } }

export default function Page() {
  return <Outbound />
}
