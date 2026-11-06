import type { Metadata } from 'next'
import { LibraryView } from '@/components/library-view'
import { PageHero } from '@/components/page-hero'
import { getVideos } from '@/lib/content'

export const metadata: Metadata = { title: 'Watch & listen', description: 'Every CKTV episode, podcast, teaching and worship session in one place.' }

export default async function WatchPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [videos, { category }] = await Promise.all([getVideos(), searchParams])
  return (
    <>
      <PageHero title="lib.title" sub="lib.sub" eyebrow="watch.eyebrow" />
      <LibraryView videos={videos} initialCategory={category} />
    </>
  )
}
