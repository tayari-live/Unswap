import Link from "next/link"
import { Logo } from "@/components/brand/logo"

/** Public content shell for legal/marketing pages (header + prose + footer). */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo wordClassName="text-[var(--navy)] text-lg" /></Link>
          <Link href="/join" className="text-sm font-semibold text-white bg-[var(--gold-dark)] hover:bg-[var(--gold-hover)] px-4 py-2.5 rounded-xl transition-colors">
            Join the waitlist
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="font-display text-4xl font-bold text-[var(--navy)]">{title}</h1>
          {updated && <p className="mt-2 text-sm text-neutral">Last updated {updated}</p>}
          <div className="legal-prose mt-8 text-[15px] text-neutral-dark leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[var(--navy)] text-white/60">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span>© {new Date().getFullYear()} UnSwap. Enabling Mobility. Empowering Community.</span>
          <nav className="flex gap-5">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

/** Section heading helper for legal prose. */
export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-bold text-[var(--navy)]">{heading}</h2>
      {children}
    </section>
  )
}
