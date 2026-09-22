"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"
import { AddWorkEmail } from "@/app/(member)/verify-identity/add-work-email"

/**
 * The swap-initiation gate for members who aren't fully verified. Clicking
 * "Request a swap" prompts for a work email inline (per the roadmap flow) rather
 * than sending them off to a separate page: a recognised institutional address
 * verifies them, and the fallback link covers documents / guarantor.
 */
export function RequestSwapGate() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
      >
        <CalendarCheck size={18} /> Request a swap
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <AddWorkEmail
        heading="Verify to request this swap"
        blurb="Confirm your professional status with your institutional email to continue — we'll email it a link. Recognised institutional domains verify you instantly."
        cta="Verify & continue"
      />
      <Link href="/verify-identity" className="block text-center text-xs font-medium text-[var(--gold-dark)] hover:underline">
        Not staff, or prefer to upload documents? Verify another way →
      </Link>
    </div>
  )
}
