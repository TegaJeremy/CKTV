import Link from 'next/link'

// Shown for unknown URLs outside the public site (and for a wrong admin address). Plain on purpose.
export default function RootNotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <p style={{ fontSize: 64, fontWeight: 900, color: '#1d4ed8', margin: 0 }}>404</p>
        <p style={{ color: '#64708c', margin: '8px 0 20px' }}>This page could not be found.</p>
        <Link href="/" style={{ color: '#1d4ed8', fontWeight: 800 }}>CKTV home</Link>
      </div>
    </main>
  )
}
