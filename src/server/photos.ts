import { NextResponse } from "next/server"
import { ApiError } from "@/server/http"

/**
 * Turn a stored base64 data URL into a real image response so pages can
 * reference a small `/api/photos/:id` URL instead of inlining the bytes into
 * server-rendered HTML. Photo rows are immutable (edits delete + recreate
 * them with new ids), so the browser may cache aggressively per user.
 */
export function imageResponse(dataUrl: string): NextResponse {
  // [\s\S] instead of the `s` flag — tsconfig targets pre-es2018.
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!match) throw new ApiError(404, "Photo not found.")
  const bytes = Buffer.from(match[2], "base64")
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=86400, immutable",
    },
  })
}
