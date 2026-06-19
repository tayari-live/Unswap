"use client"

import { useEffect } from "react"
import { Logo } from "@/components/brand/logo"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>
        <p className="font-display text-6xl font-bold text-[var(--crimson)]">500</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-[var(--navy)]">Something went wrong</h1>
        <p className="mt-3 text-neutral">
          An unexpected error occurred on our side. Please try again in a moment.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-[var(--navy)] border border-[var(--border)] hover:border-[var(--navy)] transition-colors"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
