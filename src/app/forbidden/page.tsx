import Link from "next/link"
import { Logo } from "@/components/brand/logo"

export const metadata = { title: "Access denied" }

/**
 * 403. Reached when a signed-in member opens something their role does not
 * cover — a member landing on an admin route, most often.
 *
 * Worded to say what happened and what to do next, without implying wrongdoing:
 * the usual cause is a stale link or an account whose verification has not
 * completed, not an attempt to break in.
 */
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>
        <p className="font-sans text-6xl font-bold text-[var(--gold)]">403</p>
        <h1 className="mt-3 font-sans text-2xl font-bold text-[var(--navy)]">Access denied</h1>
        <p className="mt-3 text-[var(--muted)] leading-relaxed">
          This page is not available to your account. If you reached it from a link,
          it may be out of date, or your membership may need to be verified first.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center py-3 px-6 rounded-[10px] text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
          >
            Go to my dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center py-3 px-6 rounded-[10px] text-sm font-semibold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--gold)] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
