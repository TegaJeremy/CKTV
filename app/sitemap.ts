import type { MetadataRoute } from 'next'
import { getPosts, getVideos } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const [videos, posts] = await Promise.all([getVideos(), getPosts()])
  return [
    ...['', '/watch', '/posts', '/about', '/contact'].map((p) => ({ url: `${base}${p}` })),
    ...videos.filter((v) => v.assetId).map((v) => ({ url: `${base}/watch/${v.id}`, lastModified: v.date })),
    ...posts.filter((p) => !p.slug.startsWith('demo')).map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.date })),
  ]
}
