"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { REQUEST_ACCESS, ABOUT, LOGIN, SECTIONS } from "@/lib/links";

/*
 * Marketing navbar.
 *
 * Transparent over the Navy hero, then White with a hairline once the page
 * moves — so the bar belongs to the hero at rest and to the document in
 * motion, and never sits as a slab on top of the opening statement.
 *
 * Desktop carries four items and one action. The mobile sheet adds Membership,
 * because a small screen has no room for the desktop compromise of "you will
 * find pricing if you keep scrolling".
 */

const DESKTOP_LINKS = [
  { label: "How it works", href: SECTIONS.howItWorks },
  { label: "Explore", href: SECTIONS.explore },
  { label: "About", href: ABOUT },
];

const MOBILE_LINKS = [
  { label: "How it works", href: SECTIONS.howItWorks },
  { label: "Explore", href: SECTIONS.explore },
  { label: "Membership", href: SECTIONS.membership },
  { label: "About", href: ABOUT },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the sheet is open, Escape closes it and the page beneath must not
  // scroll — otherwise closing it returns you somewhere you did not leave.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // The sheet is White, so the bar inside it must take its light treatment even
  // at scroll position zero.
  const light = scrolled || open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[200] transition-colors duration-300 ${
          light
            ? "border-b border-navy/10 bg-white"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <Container>
          <div className="flex h-[72px] items-center justify-between lg:h-[84px]">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="UnSwap home"
            >
              <Image
                src="/unswap-logo.png"
                alt=""
                width={112}
                height={112}
                priority
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />
              <span
                className={`text-[17px] font-bold tracking-[0.16em] transition-colors duration-300 ${
                  light ? "text-navy" : "text-white"
                }`}
              >
                UNSWAP
              </span>
            </Link>

            <nav className="hidden items-center gap-10 md:flex">
              {DESKTOP_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[12px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 ${
                    light
                      ? "text-navy hover:text-gold-ink"
                      : "text-white/85 hover:text-gold"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={REQUEST_ACCESS}
                className="bg-gold px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-navy transition-colors duration-200 hover:bg-gold-hover"
              >
                Request access
              </Link>
            </nav>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={`md:hidden ${light ? "text-navy" : "text-white"}`}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile sheet. Sits below the bar so the close control stays reachable. */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[72px] z-[190] overflow-y-auto bg-white md:hidden"
        >
          <nav className="flex flex-col px-6 pb-10 pt-6">
            {MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-navy/10 py-5 font-display text-[26px] font-light text-navy"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={REQUEST_ACCESS}
              onClick={() => setOpen(false)}
              className="mt-8 bg-gold px-8 py-4 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-navy"
            >
              Request access
            </Link>
            <Link
              href={LOGIN}
              onClick={() => setOpen(false)}
              className="mt-5 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-ink-55"
            >
              Member log in
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

// Local copy of the page gutter: the nav must line up with every section below
// it, and importing the server component here would drag it into the bundle.
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1180px] px-6 lg:px-10">{children}</div>;
}
