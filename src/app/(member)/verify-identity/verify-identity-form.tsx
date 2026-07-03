"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, FileCheck2, X, ShieldCheck } from "lucide-react"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB (pre-compression source limit)
const ACCEPT = "image/png,image/jpeg,image/webp"
const MAX_EDGE = 2000 // keep IDs legible while shrinking the upload payload

function FileField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string | null
  onChange: (dataUrl: string | null, error?: string) => void
}) {
  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPT.split(",").includes(file.type)) {
      return onChange(null, "Please upload a PNG, JPG, or WebP image.")
    }
    if (file.size > MAX_BYTES) {
      return onChange(null, "That image is over 5 MB. Please upload a smaller file.")
    }
    const reader = new FileReader()
    reader.onload = () => {
      // Downscale + re-encode so a phone photo of an ID doesn't blow past the
      // request-size limit (documents are sent inline as base64 data URLs).
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return onChange(reader.result as string) // fallback: original
        ctx.drawImage(img, 0, 0, w, h)
        onChange(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = () => onChange(null, "Could not read that image.")
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-2">
        {label}
      </label>
      {value ? (
        <div className="relative rounded-xl border border-[var(--border)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="w-full h-44 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove file"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[var(--navy)] flex items-center justify-center shadow hover:bg-white"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-[var(--teal)] text-white px-2.5 py-1 rounded-full">
            <FileCheck2 size={13} /> Ready
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--gold)] transition-colors text-center px-4">
          <UploadCloud size={26} className="text-neutral mb-2" />
          <span className="text-sm font-semibold text-[var(--navy)]">Click to upload</span>
          <span className="text-xs text-neutral mt-1">{hint}</span>
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  )
}

export function VerifyIdentityForm({ type }: { type: "fast_track" | "manual" }) {
  const router = useRouter()
  const [idCard, setIdCard] = useState<string | null>(null)
  const [proof, setProof] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const manual = type === "manual"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!idCard) return setError("Please upload your staff ID.")
    if (manual && !proof) return setError("Please upload your proof of employment.")

    setLoading(true)
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCardUrl: idCard, proofUrl: manual ? proof : undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not submit your documents.")
        setLoading(false)
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3 rounded-lg">
          <p className="text-sm text-[var(--crimson)] font-medium">{error}</p>
        </div>
      )}

      <FileField
        label="Staff ID card (front)"
        hint="PNG, JPG or WebP · max 5 MB"
        value={idCard}
        onChange={(v, err) => {
          setIdCard(v)
          if (err) setError(err)
        }}
      />

      {manual && (
        <FileField
          label="Proof of employment"
          hint="Pay slip with personal details redacted — organisation and status only"
          value={proof}
          onChange={(v, err) => {
            setProof(v)
            if (err) setError(err)
          }}
        />
      )}

      <div className="flex items-start gap-2.5 text-xs text-neutral bg-[var(--parchment)] border border-[var(--gold)]/20 rounded-xl p-3">
        <ShieldCheck size={16} className="text-[var(--gold-dark)] flex-shrink-0 mt-0.5" />
        <span>
          Your documents are reviewed only by UnSwap verification officers and are
          never shown to other members.
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
      >
        {loading ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  )
}
