import { requireAdmin } from '@/lib/admin-auth'
import { cloudConfig, signUpload } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/** Gives the admin page a one-time signed upload ticket so files go straight from the browser to Cloudinary. */
export async function POST(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  if (!cloudConfig()) return Response.json({ error: 'Cloudinary is not configured.' }, { status: 503 })

  const body = (await req.json().catch(() => ({}))) as { kind?: string; filename?: string }
  const kind = body.kind === 'video' ? 'video' : 'image'
  return Response.json(signUpload(kind, String(body.filename ?? kind)))
}
