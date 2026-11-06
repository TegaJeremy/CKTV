import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VideoView } from '@/components/video-view'
import { getVideo, getVideos } from '@/lib/content'
import { thumbOf } from '@/lib/media'

type Props = { params: Promise<{ id: string[] }> }

const idFrom = (parts: string[]) => decodeURIComponent(parts[parts.length - 1] ?? '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await getVideo(idFrom((await params).id))
  if (!video) return { title: 'Video not found' }
  const image = thumbOf(video, 1200)
  const description = video.description.en?.slice(0, 160) || 'Watch on CKTV'
  return {
    title: video.title.en,
    description,
    openGraph: { title: video.title.en, description, type: 'video.other', images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title: video.title.en, description, images: image ? [image] : undefined },
  }
}

export default async function VideoPage({ params }: Props) {
  const id = idFrom((await params).id)
  const [video, all] = await Promise.all([getVideo(id), getVideos()])
  if (!video) notFound()
  const others = all.filter((v) => v.id !== video.id)
  const related = [...others.filter((v) => v.category === video.category), ...others.filter((v) => v.category !== video.category)].slice(0, 4)
  return <VideoView video={video} related={related} />
}
