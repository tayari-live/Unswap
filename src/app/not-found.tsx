import Link from "next/link"
import { Logo } from "@/components/brand/logo"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Logo underline wordClassName="text-[var(--navy)]" />
        </div>
        <p className="font-display text-6xl font-bold text-[var(--gold)]">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-[var(--navy)]">Page not found</h1>
        <p className="mt-3 text-neutral">
          The page you&apos;re looking for has moved or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
