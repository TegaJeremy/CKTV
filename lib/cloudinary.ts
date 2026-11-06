import { createHash, randomBytes } from 'node:crypto'
import { slugify } from './media'

/*
 * Tiny Cloudinary client using only fetch (no SDK, nothing to install).
 * SERVER ONLY: it reads CLOUDINARY_API_SECRET. Never import this file from a "use client" component.
 *
 * Data model (no database):
 *   - Videos, thumbnails and images are normal Cloudinary assets.
 *   - The "catalog" (titles, descriptions, categories, posts, settings) is stored as small JSON files
 *     uploaded to Cloudinary as raw assets: cktv/data/videos, cktv/data/posts, cktv/data/settings.
 */

type Config = { cloud: string; key: string; secret: string }

export function cloudConfig(): Config | null {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  return cloud && key && secret ? { cloud, key, secret } : null
}

function need(): Config {
  const c = cloudConfig()
  if (!c) throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
  return c
}

/** Cloudinary signature: sha1 of the sorted "key=value&key=value" string + API secret. */
export function signParams(params: Record<string, string | number | undefined>, secret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(toSign + secret).digest('hex')
}

const basicAuth = (c: Config) => 'Basic ' + Buffer.from(`${c.key}:${c.secret}`).toString('base64')

/* ---------------------------- JSON catalogs ---------------------------- */

export const IDS = {
  videos: 'cktv/data/videos',
  posts: 'cktv/data/posts',
  settings: 'cktv/data/settings',
} as const

/**
 * Read a JSON catalog. We first ask Cloudinary for the *latest version* URL of the file,
 * so we never read a stale cached copy after an edit.
 * fresh=true is used by the admin (always live); public pages are cached for 60 seconds.
 */
export async function readJson<T>(publicId: string, fallback: T, fresh = false): Promise<T> {
  const c = need()
  const cache: RequestInit & { next?: { revalidate: number } } = fresh ? { cache: 'no-store' } : { next: { revalidate: 60 } }
  const detail = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/resources/raw/upload/${publicId}`, {
    headers: { Authorization: basicAuth(c) },
    ...cache,
  })
  if (detail.status === 404) return fallback
  if (!detail.ok) throw new Error(`Cloudinary read failed (${detail.status}): ${await detail.text()}`)
  const meta = (await detail.json()) as { secure_url: string }
  const file = await fetch(meta.secure_url, cache)
  if (!file.ok) return fallback
  return (await file.json()) as T
}

export async function writeJson(publicId: string, data: unknown): Promise<void> {
  const c = need()
  const params = { invalidate: 'true', overwrite: 'true', public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }
  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append('api_key', c.key)
  form.append('signature', signParams(params, c.secret))
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'data.json')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/raw/upload`, { method: 'POST', body: form, cache: 'no-store' })
  if (!res.ok) throw new Error(`Cloudinary write failed (${res.status}): ${await res.text()}`)
}

/* ------------------------------- Assets ------------------------------- */

export async function destroyAsset(publicId: string, resourceType: 'image' | 'video' | 'raw'): Promise<void> {
  if (!publicId) return
  const c = need()
  const params = { invalidate: 'true', public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: c.key, signature: signParams(params, c.secret) })
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/${resourceType}/destroy`, { method: 'POST', body, cache: 'no-store' })
  if (!res.ok) throw new Error(`Cloudinary delete failed (${res.status}): ${await res.text()}`)
}

/**
 * Prepare a browser-direct upload. The browser sends the (possibly huge) file straight to Cloudinary,
 * so it never passes through our server. Only the signature is created here, keeping the secret private.
 */
export function signUpload(kind: 'video' | 'image', filename: string) {
  const c = need()
  const base = filename.replace(/\.[^.]+$/, '')
  const publicId = `cktv/${kind === 'video' ? 'videos' : 'images'}/${slugify(base)}-${randomBytes(2).toString('hex')}`
  const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) }
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloud}/${kind}/upload`,
    fields: { public_id: params.public_id, timestamp: String(params.timestamp), api_key: c.key, signature: signParams(params, c.secret) },
  }
}
