import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminApp } from '@/components/admin/admin-app'
import { isValidAdminKey } from '@/lib/admin-auth'

// Never indexed, never sends the address to other sites in the Referer header.
export const metadata: Metadata = {
  title: 'CKTV Admin',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

/**
 * The secret address IS the key: https://your-site.com/<ADMIN_SECRET>
 * Any other address under "/" (that is not a real page) simply shows the normal 404 page.
 */
export default async function AdminPage({ params }: { params: Promise<{ adminKey: string }> }) {
  const { adminKey } = await params
  if (!isValidAdminKey(decodeURIComponent(adminKey))) notFound()
  return <AdminApp adminKey={decodeURIComponent(adminKey)} />
}
