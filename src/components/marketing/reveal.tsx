"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/*
 * Fade-and-rise on first scroll into view.
 *
 * Two deliberate choices:
 *
 *   1. The hidden state is applied by this effect, not by the server. If the
 *      script never runs, nothing was ever hidden — a broken bundle degrades to
 *      a static page rather than a blank one.
 *   2. The observer disconnects after the first reveal. Content that fades back
 *      out when you scroll up reads as a demo; this should read as a document
 *      that happens to arrive gracefully.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** Milliseconds. Used to stagger siblings — keep under ~200ms. */
  delay?: number;
  className?: string;
  // Passed through so a wrapper can still carry data-* and ARIA attributes
  // without needing a second element around it.
  [key: `data-${string}`]: string | undefined;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the OS preference before hiding anything: the CSS fallback would
    // reveal it anyway, but this avoids a pointless observer on every section.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.reveal = "pending";
    el.style.transitionDelay = delay ? `${delay}ms` : "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      // A little margin off the bottom, so the reveal finishes as the section
      // settles rather than starting once it is already fully read.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
