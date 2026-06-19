import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * UnSwap brand mark — a key crossing a globe, signifying secure access to a
 * worldwide network. Strokes use `currentColor`, so the colour is set by the
 * parent's text colour (Diplomatic Gold on navy, navy on light surfaces).
 *
 * To swap in the original raster/vector asset later, drop it at
 * `public/logo.svg` and replace the <svg> below with
 * `<Image src="/logo.svg" ... />` — call sites won't need to change.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Globe */}
      <circle cx="39" cy="28" r="15" strokeWidth="2.4" />
      <ellipse cx="39" cy="28" rx="6" ry="15" strokeWidth="1.8" />
      <line x1="24.2" y1="28" x2="53.8" y2="28" strokeWidth="1.8" />
      <path d="M27 18.5 Q39 22.5 51 18.5" strokeWidth="1.8" />
      <path d="M27 37.5 Q39 33.5 51 37.5" strokeWidth="1.8" />
      {/* Key */}
      <circle cx="17" cy="19" r="7.5" strokeWidth="2.4" />
      <circle cx="17" cy="19" r="3" strokeWidth="2" />
      <line x1="22.3" y1="24.3" x2="39" y2="41" strokeWidth="2.4" />
      <line x1="33.5" y1="35.5" x2="38" y2="31" strokeWidth="2.4" />
      <line x1="39" y1="41" x2="43.5" y2="36.5" strokeWidth="2.4" />
    </svg>
  )
}

/**
 * Full lockup: brand mark + "UnSwap" wordmark in Playfair Display.
 * `underline` adds the short gold rule beneath the wordmark (used on the
 * centred auth header).
 */
export function Logo({
  className,
  markClassName,
  wordClassName,
  showWord = true,
  underline = false,
}: {
  className?: string
  markClassName?: string
  wordClassName?: string
  showWord?: boolean
  underline?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/unswap-logo.png"
        alt="UnSwap Logo"
        width={36}
        height={36}
        className={cn("w-9 h-9 object-contain rounded-md", markClassName)}
        priority
      />
      {showWord && (
        <span className="inline-flex flex-col">
          <span
            className={cn(
              "font-display text-2xl font-bold tracking-tight leading-none",
              wordClassName,
            )}
          >
            UnSwap
          </span>
          {underline && (
            <span className="mt-1.5 h-0.5 w-10 rounded-full bg-gold" />
          )}
        </span>
      )}
    </span>
  )
}
