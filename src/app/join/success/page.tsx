import { Suspense } from "react"
import { Logo } from "@/components/brand/logo"
import { ShareCard } from "./share-card"

export const metadata = { title: "You're on the waitlist" }

export default function WaitlistSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10">
          <Suspense fallback={<p className="text-center text-sm text-neutral">Loading…</p>}>
            <ShareCard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
