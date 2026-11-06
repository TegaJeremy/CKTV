import { timingSafeEqual } from 'node:crypto'

/**
 * The admin area has no login. Instead the secret URL *is* the key:
 *   https://your-site.com/<ADMIN_SECRET>
 * The same secret must be sent in the "x-admin-key" header on every admin API call,
 * so the API cannot be used by someone who doesn't know the URL.
 */
export function isValidAdminKey(key: string | null | undefined): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret || secret.length < 12 || !key) return false
  const a = Buffer.from(key)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Returns a Response to send back if the request is NOT allowed, or null if it is. */
export function requireAdmin(req: Request): Response | null {
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.length < 12) {
    return Response.json({ error: 'Admin is disabled. Set ADMIN_SECRET (at least 12 characters) in your environment variables.' }, { status: 503 })
  }
  if (!isValidAdminKey(req.headers.get('x-admin-key'))) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}
