/*
 * Browser-side direct upload to Cloudinary.
 * The server only signs the request (so the API secret stays private); the file itself goes straight to Cloudinary.
 * Files over 20 MB are sent in chunks so very large videos work and progress is shown.
 */

export type UploadResult = {
  public_id: string
  secure_url: string
  duration?: number
  bytes: number
  format?: string
}

type Ticket = { uploadUrl: string; fields: Record<string, string> }

const CHUNK = 20 * 1024 * 1024

function sendPart(ticket: Ticket, blob: Blob, filename: string, range: { start: number; end: number; total: number; id: string } | null, onLoaded: (bytes: number) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', ticket.uploadUrl)
    if (range) {
      xhr.setRequestHeader('X-Unique-Upload-Id', range.id)
      xhr.setRequestHeader('Content-Range', `bytes ${range.start}-${range.end}/${range.total}`)
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && onLoaded(e.loaded)
    xhr.onload = () => {
      let data: any = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* not json */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data?.error?.message || `Upload failed (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and try again.'))
    const form = new FormData()
    Object.entries(ticket.fields).forEach(([k, v]) => form.append(k, v))
    form.append('file', blob, filename)
    xhr.send(form)
  })
}

export async function uploadFile(file: File, kind: 'video' | 'image', adminKey: string, onProgress: (percent: number) => void): Promise<UploadResult> {
    const MAX_VIDEO_MB = 30
if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024) {
  throw new Error(`This video is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_VIDEO_MB} MB. Please compress it or upload a shorter clip.`)
}

   const res = await fetch('/api/admin/sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify({ kind, filename: file.name }),
  })
  const ticket = (await res.json()) as Ticket & { error?: string }
  if (!res.ok) throw new Error(ticket.error || 'Could not start the upload.')

  const total = file.size
  if (total <= CHUNK) return sendPart(ticket, file, file.name, null, (loaded) => onProgress(Math.round((loaded / total) * 100)))

  const id = crypto.randomUUID()
  let start = 0
  let result: UploadResult | undefined
  while (start < total) {
    const end = Math.min(start + CHUNK, total)
    const offset = start
    result = await sendPart(ticket, file.slice(start, end), file.name, { start, end: end - 1, total, id }, (loaded) => onProgress(Math.round(((offset + loaded) / total) * 100)))
    start = end
  }
  return result as UploadResult
}
