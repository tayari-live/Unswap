"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REQUEST_ACCESS } from "@/lib/links";

/*
 * Mobile-only persistent action.
 *
 * Held back until the hero has passed — while the hero is on screen its own
 * button is right there, and a second one would be noise. It also retires once
 * the final call to action is in view, so the two never stack on top of each
 * other at the foot of the page.
 *
 * The page reserves matching bottom padding, so this never covers the footer.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const finalCta = document.getElementById("final-cta");

    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const atEnd = finalCta
        ? finalCta.getBoundingClientRect().top < window.innerHeight
        : false;
      setVisible(pastHero && !atEnd);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[180] border-t border-navy/10 bg-white/95 p-4 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <Link
        href={REQUEST_ACCESS}
        tabIndex={visible ? undefined : -1}
        className="flex w-full items-center justify-center bg-gold px-8 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-navy"
      >
        Request access
      </Link>
    </div>
  );
}
