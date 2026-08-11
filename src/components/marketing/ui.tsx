import Link from "next/link";
import type { ReactNode } from "react";

/*
 * The small, repeated pieces of the marketing page.
 *
 * These exist so that restraint is the default. A section that needs an
 * eyebrow, a rule or a button reaches for one of these rather than inventing a
 * new letter-spacing or a slightly different gold — which is how a page like
 * this loses its composure one section at a time.
 */

/** Page gutter. One width for every section, so the left edge never wanders. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1180px] px-6 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Small capitalised label above a heading.
 *
 * On light grounds this is Gold Ink rather than brand Gold — at 11px, #C9A84C
 * on Parchment is 2.1:1 and effectively unreadable.
 */
export function Eyebrow({
  children,
  ground = "light",
  className = "",
}: {
  children: ReactNode;
  ground?: "light" | "navy";
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-medium uppercase leading-[1.6] tracking-[0.24em] ${
        ground === "navy" ? "text-gold" : "text-gold-ink"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** The editorial voice: Cormorant Light, generous leading, tight tracking. */
export function Display({
  children,
  as: Tag = "h2",
  ground = "light",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "p";
  ground?: "light" | "navy" | "gold";
  className?: string;
}) {
  const tone =
    ground === "gold" ? "text-gold" : ground === "navy" ? "text-white" : "text-navy";
  return (
    <Tag
      className={`font-display font-light leading-[1.08] tracking-[-0.015em] text-balance ${tone} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Functional heading — Inter Bold. Used for product headings, card titles. */
export function Heading({
  children,
  as: Tag = "h3",
  className = "",
}: {
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
  className?: string;
}) {
  return (
    <Tag className={`font-sans font-bold tracking-[-0.01em] ${className}`}>
      {children}
    </Tag>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 px-8 py-4 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors duration-200";

/** Primary action. Gold fill, Navy label — 6.5:1, and the only filled button. */
export function GoldButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${BUTTON_BASE} bg-gold text-navy hover:bg-gold-hover ${className}`}
    >
      {children}
    </Link>
  );
}

/** Secondary action. Outlined and understated — it must not compete. */
export function GhostButton({
  href,
  children,
  ground = "navy",
  className = "",
}: {
  href: string;
  children: ReactNode;
  ground?: "light" | "navy";
  className?: string;
}) {
  const tone =
    ground === "navy"
      ? "border-white/35 text-white hover:border-gold hover:text-gold"
      : "border-navy/25 text-navy hover:border-navy";
  return (
    <Link href={href} className={`${BUTTON_BASE} border ${tone} ${className}`}>
      {children}
    </Link>
  );
}

/** Thin gold rule. The page's only decorative flourish. */
export function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-14 bg-gold ${className}`} aria-hidden="true" />;
}
