import Image from "next/image"
import { cn } from "@/lib/utils"

import Link from "next/link"

/**
 * Full lockup: official UnSwap logo + "UnSwap" wordmark in Playfair Display.
 * `underline` adds the short gold rule beneath the wordmark (used on the
 * centred auth header).
 */
export function Logo({
  className,
  markClassName,
  wordClassName,
  showWord = false,
  underline = false,
  href = "/",
}: {
  className?: string
  markClassName?: string
  wordClassName?: string
  showWord?: boolean
  underline?: boolean
  href?: string | null
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/unswap-logo.png"
        alt="UnSwap Logo"
        width={80}
        height={80}
        className={cn("w-[3.6rem] h-[3.6rem] sm:w-[4.8rem] sm:h-[4.8rem] object-contain", markClassName)}
        priority
      />
      {showWord && (
        <span className="inline-flex flex-col">
          <span
            className={cn(
              "font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none",
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

  if (href) {
    return <Link href={href} className="inline-flex hover:opacity-90 transition-opacity">{content}</Link>
  }
  
  return content
}

