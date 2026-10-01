import { NextResponse } from "next/server"
import sharp from "sharp"
import { ApiError } from "@/server/http"

export const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)

function decode(dataUrl: string): { mime: string; bytes: Buffer } {
  // [\s\S] instead of the `s` flag — tsconfig targets pre-es2018.
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!match) throw new ApiError(404, "Photo not found.")
  return { mime: match[1], bytes: Buffer.from(match[2], "base64") }
}

/**
 * Resolve a stored photo to raw bytes, whether it's a legacy inline base64 data
 * URL or a CDN (Vercel Blob) https URL. A CDN image is fetched server-side, so
 * the blurred-preview path can still bake the blur into the bytes without ever
 * handing the original URL to an unverified viewer.
 */
async function toBytes(src: string): Promise<{ mime: string; bytes: Buffer }> {
  if (isHttpUrl(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new ApiError(404, "Photo not found.")
    return { mime: res.headers.get("content-type") || "image/jpeg", bytes: Buffer.from(await res.arrayBuffer()) }
  }
  return decode(src)
}

/**
 * Turn a stored base64 data URL into a real image response so pages can
 * reference a small `/api/photos/:id` URL instead of inlining the bytes into
 * server-rendered HTML. Photo rows are immutable (edits delete + recreate
 * them with new ids), so the browser may cache aggressively per user.
 */
export function imageResponse(dataUrl: string): NextResponse {
  const { mime, bytes } = decode(dataUrl)
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=86400, immutable",
    },
  })
}

/**
 * A hard-downscaled, blurred rendition for preview (unverified) viewers. Because
 * the blur is baked into the bytes server-side, the original image never leaves
 * the server — unlike a client-side CSS blur, where the full-resolution file is
 * still delivered. `no-store` so a just-verified member isn't stuck with a
 * cached blurred copy.
 */
export async function blurredImageResponse(src: string): Promise<NextResponse> {
  const { bytes } = await toBytes(src)
  // A larger base blurred hard reads as smooth "frosted glass" rather than the
  // blocky pixelation of a tiny upscale — while still carrying no usable detail
  // (faces, text and layout are all gone).
  const out = await sharp(bytes)
    .rotate() // honour EXIF orientation before we drop the metadata
    .resize(220, 220, { fit: "inside", withoutEnlargement: true })
    .blur(14)
    .jpeg({ quality: 50 })
    .toBuffer()
  return new NextResponse(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.length),
      "Cache-Control": "private, no-store",
    },
  })
}
