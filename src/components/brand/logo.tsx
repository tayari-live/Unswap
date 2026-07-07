import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Full lockup: official UnSwap logo + "UnSwap" wordmark in Playfair Display.
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
        width={56}
        height={56}
        className={cn("w-14 h-14 object-contain", markClassName)}
        priority
      />
      {showWord && (
        <span className="inline-flex flex-col">
          <span
            className={cn(
              "font-display text-3xl font-bold tracking-tight leading-none",
              wordClassName,
            )}
          >
            UnSwap
          </span>
          {underline && (
            <span className="mt-1.5 h-0.5 w-10 rounded-full bg-[var(--gold)]" />
          )}
        </span>
      )}
    </span>
  )
}

