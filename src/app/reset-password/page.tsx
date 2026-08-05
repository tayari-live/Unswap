import { Suspense } from "react"
import { ResetForm } from "./reset-form"

export const metadata = { title: "UnSwap | Reset Password" }

export default function ResetPasswordPage() {
  // ResetForm renders the full two-pane shell itself, because its title and
  // eyebrow change once the password has been updated.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-wl-navy">
          <p className="text-sm text-wl-muted">Loading…</p>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  )
}
