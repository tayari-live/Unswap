import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto"

// AES-256-GCM at-rest encryption for sensitive listing fields (full address,
// emergency contact). The key is derived from ENCRYPTION_KEY (or AUTH_SECRET as
// a stable fallback). Format: base64(iv):base64(tag):base64(ciphertext).
function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || "unswap-dev-fallback-key"
  return createHash("sha256").update(secret).digest()
}

export function encryptField(plain?: string | null): string | null {
  const text = plain?.trim()
  if (!text) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decryptField(blob?: string | null): string | null {
  if (!blob) return null
  try {
    const [ivB, tagB, dataB] = blob.split(":")
    if (!ivB || !tagB || !dataB) return null
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"))
    decipher.setAuthTag(Buffer.from(tagB, "base64"))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()])
    return dec.toString("utf8")
  } catch {
    return null
  }
}
