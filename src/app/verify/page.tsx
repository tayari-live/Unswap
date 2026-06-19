import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { verifyEmailToken } from "@/server/services/registration"

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10 text-center">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
              ok ? "bg-[var(--teal-light)] text-[var(--teal)]" : "bg-[var(--crimson)]/10 text-[var(--crimson)]"
            }`}
          >
            {ok ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
          </div>

          {ok ? (
            <>
              <h1 className="font-display text-2xl font-bold text-[var(--navy)]">
                Email confirmed
              </h1>
              <p className="mt-3 text-neutral leading-relaxed">
                Thank you{firstName ? `, ${firstName}` : ""}. Your institutional
                email is verified. The next step is to upload your staff ID so our
                team can complete your verification.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-[var(--navy)]">
                Verification failed
              </h1>
              <p className="mt-3 text-neutral leading-relaxed">{message}</p>
            </>
          )}

          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
          >
            Continue to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
