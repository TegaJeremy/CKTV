import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { cloudConfig, destroyAsset } from '@/lib/cloudinary'
import { getVideos, saveVideos } from '@/lib/content'
import { isCloudinaryUrl, slugify } from '@/lib/media'
import { CATEGORIES, type Category, type Localized, type Video } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LANGS = ['en', 'ig', 'yo', 'ha', 'fr', 'es'] as const

function cleanLocalized(value: unknown, max = 5000): Localized {
  const out: Localized = {}
  if (value && typeof value === 'object') {
    for (const l of LANGS) {
      const v = (value as Record<string, unknown>)[l]
      if (typeof v === 'string' && v.trim()) out[l] = v.trim().slice(0, max)
    }
  }
  return out
}

function cleanVideo(input: Partial<Video>): Video | string {
  const title = cleanLocalized(input.title, 200)
  if (!title.en) return 'An English title is required.'
  const src = String(input.src ?? '')
  if (!isCloudinaryUrl(src)) return 'The video must be uploaded to Cloudinary first.'
  const thumb = String(input.thumb ?? '')
  if (thumb && !isCloudinaryUrl(thumb)) return 'Thumbnail must be a Cloudinary image.'
  const category = CATEGORIES.includes(input.category as Category) ? (input.category as Category) : 'other'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date)) ? String(input.date) : new Date().toISOString().slice(0, 10)
  const assetId = String(input.assetId ?? '')
  const id = String(input.id || assetId.split('/').pop() || slugify(title.en))
  const yt = String(input.youtubeUrl ?? '').trim()
const youtubeUrl = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be)\//i.test(yt) ? yt : ''
  return {
    id,
    assetId,
    title,
    description: cleanLocalized(input.description),
    category,
    date,
    youtubeUrl,
    published: input.published !== false,
    src,
    thumb,
    thumbAssetId: input.thumbAssetId ? String(input.thumbAssetId) : undefined,
    duration: typeof input.duration === 'number' ? input.duration : undefined,
    bytes: typeof input.bytes === 'number' ? input.bytes : undefined,
    format: input.format ? String(input.format) : undefined,
  }
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    return Response.json({ configured: !!cloudConfig(), videos: await getVideos({ drafts: true, fresh: true }) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

/** Create or update one video entry. */
export async function PUT(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const cleaned = cleanVideo((await req.json()) as Partial<Video>)
    if (typeof cleaned === 'string') return Response.json({ error: cleaned }, { status: 400 })
    const list = await getVideos({ drafts: true, fresh: true })
    const index = list.findIndex((v) => v.id === cleaned.id)
    if (index >= 0) list[index] = cleaned
    else list.push(cleaned)
    await saveVideos(list)
    revalidatePath('/', 'layout')
    return Response.json({ videos: list })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

/** Delete a video entry and its files on Cloudinary. */
export async function DELETE(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const id = new URL(req.url).searchParams.get('id') ?? ''
    const list = await getVideos({ drafts: true, fresh: true })
    const target = list.find((v) => v.id === id)
    if (!target) return Response.json({ error: 'Video not found.' }, { status: 404 })
    await saveVideos(list.filter((v) => v.id !== id))
    // Remove the files too (ignore failures so a missing file never blocks deleting the entry)
    await destroyAsset(target.assetId, 'video').catch(() => undefined)
    if (target.thumbAssetId) await destroyAsset(target.thumbAssetId, 'image').catch(() => undefined)
    revalidatePath('/', 'layout')
    return Response.json({ videos: list.filter((v) => v.id !== id) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}
