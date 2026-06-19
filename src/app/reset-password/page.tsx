import { Suspense } from "react"
import { Logo } from "@/components/brand/logo"
import { ResetForm } from "./reset-form"

export const metadata = { title: "UnSwap | Reset Password" }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10">
          <Suspense fallback={<p className="text-center text-sm text-neutral">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
