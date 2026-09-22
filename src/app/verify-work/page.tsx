import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { confirmWorkEmail, type WorkEmailOutcome } from "@/server/services/work-email"

export const dynamic = "force-dynamic"

export default async function VerifyWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let ok = false
  let message = ""
  let firstName = ""
  let outcome: WorkEmailOutcome = "fast_track"
  try {
    const result = await confirmWorkEmail(token ?? "")
    ok = true
    firstName = result.firstName
    outcome = result.outcome
  } catch (err: any) {
    message = err?.message || "This confirmation link is invalid."
  }

  const verified = ok && outcome === "verified"

  return (
    <AuthShell
      eyebrow={ok ? "Verified Access" : "Verification"}
      title={ok ? (verified ? "You're verified" : "Email confirmed") : "Confirmation failed"}
      logoHref={null}
      footer={
        <p className="text-sm text-wl-ivory-dim">
          Need help?{" "}
          <Link href="/dashboard" className="text-wl-gold hover:text-wl-gold-light transition-colors">
            Back to your dashboard
          </Link>
        </p>
      }
    >
      <div className="text-center">
        <div
          className={`mx-auto w-16 h-16 border flex items-center justify-center mb-6 ${
            ok ? "border-wl-border text-wl-gold" : "border-[rgba(193,18,31,0.4)] text-error-light"
          }`}
        >
          {ok ? <CheckCircle2 size={26} strokeWidth={1.4} /> : <XCircle size={26} strokeWidth={1.4} />}
        </div>

        {ok ? (
          <>
            <p className="text-sm text-wl-ivory-dim leading-relaxed">
              {verified ? (
                <>
                  Thank you{firstName ? `, ${firstName}` : ""}. Your institutional email
                  confirms your professional status, so you&apos;re fully verified. You can
                  now list your home and arrange exchanges with vetted peers.
                </>
              ) : (
                <>
                  Thank you{firstName ? `, ${firstName}` : ""}. Your institutional email is
                  confirmed and your organisation is recognised. Upload your staff ID to
                  finish — no proof of employment needed.
                </>
              )}
            </p>
            <Link
              href={verified ? "/dashboard" : "/verify-identity"}
              className="mt-8 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-wl-gold hover:bg-wl-gold-light px-8 py-3.5 transition-colors"
            >
              {verified ? "Go to your dashboard" : "Upload staff ID"}
            </Link>
          </>
        ) : (
          <>
            <div className="border-l-2 border-[rgba(193,18,31,0.5)] bg-[rgba(193,18,31,0.08)] px-4 py-3.5 text-sm text-wl-ivory text-left">
              {message}
            </div>
            <Link
              href="/verify-identity"
              className="mt-7 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.1em] text-wl-gold hover:text-wl-gold-light transition-colors"
            >
              Back to verification
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
