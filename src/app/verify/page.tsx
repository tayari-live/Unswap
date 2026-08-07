import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { verifyEmailToken } from "@/server/services/registration"
import { ResendVerification } from "./resend-verification"

export const dynamic = "force-dynamic"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let ok = false
  let message = ""
  let firstName = ""
  try {
    const result = await verifyEmailToken(token ?? "")
    ok = true
    firstName = result.firstName
  } catch (err: any) {
    message = err?.message || "This verification link is invalid."
  }

  return (
    <AuthShell
      eyebrow={ok ? "Verified Access" : "Verification"}
      title={ok ? "Email confirmed" : "Verification failed"}
      footer={
        <p className="text-sm text-wl-ivory-dim">
          Need an account?{" "}
          <Link href="/register" className="text-wl-gold hover:text-wl-gold-light transition-colors">
            Request access
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
              Thank you{firstName ? `, ${firstName}` : ""}. Your email is confirmed.
              Sign in to set up your profile and start exploring homes. You can verify
              your identity later, when you are ready to request or accept a swap.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.12em] text-ink bg-wl-gold hover:bg-wl-gold-light px-8 py-3.5 transition-colors"
            >
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="border-l-2 border-[rgba(193,18,31,0.5)] bg-[rgba(193,18,31,0.08)] px-4 py-3.5 text-sm text-wl-ivory text-left">
              {message}
            </div>

            <div className="mt-7 text-left border border-wl-border p-5">
              <p className="text-[11px] tracking-[0.18em] uppercase font-medium text-wl-gold">
                Link expired?
              </p>
              <p className="mt-2 text-sm text-wl-ivory-dim leading-relaxed">
                Enter your email address and we will send you a fresh confirmation link.
              </p>
              <ResendVerification />
            </div>

            <Link
              href="/login"
              className="mt-7 inline-flex justify-center items-center text-[12px] font-medium uppercase tracking-[0.1em] text-wl-gold hover:text-wl-gold-light transition-colors"
            >
              Continue to sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
