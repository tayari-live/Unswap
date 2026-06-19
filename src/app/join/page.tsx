import { Suspense } from "react"
import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { WaitlistForm } from "./waitlist-form"

export const metadata = { title: "Join the Waitlist" }

export default function WaitlistPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo underline wordClassName="text-[var(--navy)]" /></Link>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10">
          <Suspense fallback={<p className="text-center text-sm text-neutral">Loading…</p>}>
            <WaitlistForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
