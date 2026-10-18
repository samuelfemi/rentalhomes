import { readEnv } from "./env"

const CLOUD_NAME = readEnv("VITE_CLOUDINARY_CLOUD_NAME") || ""
const UPLOAD_PRESET = readEnv("VITE_CLOUDINARY_UPLOAD_PRESET") || ""

export function isCloudinaryConfigured() {
  return CLOUD_NAME !== "" && UPLOAD_PRESET !== ""
}

/**
 * Insert a Cloudinary transformation into a cloudinary CDN URL
 * (e.g. "f_auto,q_auto,w_640") so images ship at the size the layout
 * actually needs, in a modern format, instead of full-resolution originals.
 * Non-Cloudinary URLs are returned untouched (they are arbitrary user input).
 */
export function withCloudinaryTransform(url: string, transform: string): string {
  const marker = "/upload/"
  const index = url.indexOf(marker)
  if (index === -1) return url
  const after = url.slice(index + marker.length)
  const firstSegment = after.split("/")[0]
  // A segment holding an existing transformation (commas, or known keys)
  // means the URL was already composed with transforms — leave it alone.
  if (firstSegment.includes(",") || /^(f_|q_|w_|h_|c_|dpr_|fl_)/.test(firstSegment)) return url
  return `${url.slice(0, index + marker.length)}${transform}/${after}`
}

/**
 * Upload an image straight to Cloudinary with an unsigned preset
 * (same flow as avatars — no secret ever touches the browser).
 * Returns the secure_url to store via POST /listings/{id}/media.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)")
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not an image`)
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`"${file.name}" exceeds 10 MB`)
  }

  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", UPLOAD_PRESET)

  // Never hang the UI: abort a stalled upload after 90s.
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 90_000)

  let res: Response
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new Error(`Upload timed out for "${file.name}" (90s) — check your connection and retry`)
    }
    throw new Error(`Upload failed for "${file.name}": ${cause instanceof Error ? cause.message : "network error"}`)
  } finally {
    window.clearTimeout(timeout)
  }
  if (!res.ok) {
    // SAFETY: Cloudinary error responses carry { error?: { message?: string } };
    // any other shape falls through to the status-code fallback below.
    const errBody = (await res.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw new Error(errBody?.error?.message || `Upload failed for "${file.name}" (${res.status})`)
  }
  // SAFETY: a successful upload responds with JSON containing secure_url;
  // a missing secure_url is treated as failure on the next line.
  const body = (await res.json()) as {
    secure_url?: string
    error?: { message?: string }
  }
  if (!body.secure_url) {
    throw new Error(body.error?.message || `Upload failed for "${file.name}"`)
  }
  return body.secure_url
}
