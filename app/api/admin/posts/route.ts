import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { cloudConfig, destroyAsset } from '@/lib/cloudinary'
import { getPosts, savePosts } from '@/lib/content'
import { isCloudinaryUrl, slugify } from '@/lib/media'
import type { Localized, Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LANGS = ['en', 'ig', 'yo', 'ha', 'fr', 'es'] as const

function cleanLocalized(value: unknown, max: number): Localized {
  const out: Localized = {}
  if (value && typeof value === 'object') {
    for (const l of LANGS) {
      const v = (value as Record<string, unknown>)[l]
      if (typeof v === 'string' && v.trim()) out[l] = v.trim().slice(0, max)
    }
  }
  return out
}

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    return Response.json({ configured: !!cloudConfig(), posts: await getPosts({ drafts: true, fresh: true }) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

export async function PUT(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const input = (await req.json()) as Partial<Post>
    const title = cleanLocalized(input.title, 200)
    if (!title.en) return Response.json({ error: 'An English title is required.' }, { status: 400 })
    const body = cleanLocalized(input.body, 60000)
    if (!body.en) return Response.json({ error: 'English post text is required.' }, { status: 400 })
    const cover = String(input.cover ?? '')
    if (cover && !isCloudinaryUrl(cover)) return Response.json({ error: 'Cover must be a Cloudinary image.' }, { status: 400 })

    const list = await getPosts({ drafts: true, fresh: true })
    let slug = String(input.slug ?? '')
    if (!slug) {
      const base = slugify(title.en)
      slug = base
      let n = 2
      while (list.some((p) => p.slug === slug)) slug = `${base}-${n++}`
    }
    const post: Post = {
      slug,
      title,
      excerpt: cleanLocalized(input.excerpt, 400),
      body,
      cover,
      coverAssetId: input.coverAssetId ? String(input.coverAssetId) : undefined,
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(input.date)) ? String(input.date) : new Date().toISOString().slice(0, 10),
      published: input.published !== false,
    }
    const index = list.findIndex((p) => p.slug === slug)
    if (index >= 0) list[index] = post
    else list.push(post)
    await savePosts(list)
    revalidatePath('/', 'layout')
    return Response.json({ posts: list, saved: post })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  try {
    const slug = new URL(req.url).searchParams.get('slug') ?? ''
    const list = await getPosts({ drafts: true, fresh: true })
    const target = list.find((p) => p.slug === slug)
    if (!target) return Response.json({ error: 'Post not found.' }, { status: 404 })
    await savePosts(list.filter((p) => p.slug !== slug))
    if (target.coverAssetId) await destroyAsset(target.coverAssetId, 'image').catch(() => undefined)
    revalidatePath('/', 'layout')
    return Response.json({ posts: list.filter((p) => p.slug !== slug) })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}
