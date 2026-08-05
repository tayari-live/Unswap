import { ThemeToggleIcon } from "@/components/theme/theme-toggle"

/**
 * The two-pane auth layout shared by the account pages: institutional image on
 * the left, form on the right. On mobile the image becomes a dimmed backdrop
 * behind the form.
 *
 * Colours come from the `.wl-root` scope (see waitlist.css), so every page that
 * uses this shell inherits both the light (cream/navy) and dark (obsidian/gold)
 * palettes without restating them.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full relative bg-wl-navy text-wl-ivory font-sans">
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggleIcon />
      </div>

      {/* Image: full-bleed backdrop on mobile, fixed left column on desktop. */}
      <div className="absolute inset-0 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[38%] overflow-hidden z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/auth-institution.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(10,14,26,0.6)]" />
        {/* Mobile: flatten the photo so the overlaid form stays readable. */}
        <div className="absolute inset-0 bg-wl-navy/92 lg:hidden" />
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="w-[60px] h-px bg-wl-gold" />
            <p className="text-white/80 text-[11px] tracking-[0.22em] uppercase">Verified access only</p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="w-full lg:w-[62%] lg:ml-[38%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,168,76,0.12)_0%,_transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/waitlist/logo.png" alt="UnSwap" className="w-24 h-24 object-contain" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wl-border" />
            <span className="text-wl-ivory-dim text-[11px] tracking-[0.22em] uppercase font-medium">{eyebrow}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wl-border" />
          </div>

          <h1 className="font-display text-[32px] sm:text-[40px] font-light text-wl-ivory text-center leading-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-wl-ivory-dim text-center text-sm leading-relaxed mb-8">{subtitle}</p>
          )}

          {children}

          {footer && <div className="mt-8 pt-6 border-t border-wl-border text-center">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

// Shared field styling — matches the login page. `--field-bg` flips with the
// theme, so inputs stay readable in both light and dark.
export const authInputCls =
  "w-full bg-[var(--field-bg)] border border-wl-border px-5 py-4 text-wl-ivory placeholder-wl-muted focus:outline-none focus:border-wl-gold focus:shadow-[0_0_0_1px_rgba(201,168,76,0.35)] transition-all duration-300 text-[15px]"

export const authLabelCls =
  "block text-wl-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1"

export const authBtnCls =
  "w-full bg-wl-gold text-wl-navy py-4 px-6 text-[13px] tracking-[0.14em] uppercase font-medium hover:bg-wl-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
