import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import {
  ABOUT,
  EXCHANGE_AGREEMENT,
  PRIVACY,
  SECTIONS,
  TERMS,
  LOGIN,
} from "@/lib/links";

/*
 * Footer.
 *
 * Sparse: a lockup, three short columns, a rule and a line of copyright.
 *
 * The non-affiliation notice sits here rather than beside the organisation
 * names in the trust strip. It has to be on the page — UnSwap is independent
 * and staff-led, and naming institutions without saying so invites exactly the
 * wrong inference — but stated at the foot of the document it reads as a legal
 * fact rather than as an apology for the section above it.
 */

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: SECTIONS.howItWorks },
      { label: "Browse", href: SECTIONS.explore },
      { label: "Membership", href: SECTIONS.membership },
      { label: "Trust & Safety", href: SECTIONS.trust },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: ABOUT },
      { label: "Contact", href: "mailto:hello@unswap.net" },
      { label: "FAQ", href: SECTIONS.faq },
      { label: "Member log in", href: LOGIN },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: PRIVACY },
      { label: "Terms", href: TERMS },
      { label: "Exchange Agreement", href: EXCHANGE_AGREEMENT },
    ],
  },
];

export function Footer() {
  return (
    <footer data-ground="navy" className="bg-navy">
      <Container className="pb-12 pt-14 lg:pt-16">
        <div className="grid gap-14 border-b border-white/12 pb-12 md:grid-cols-12">
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/unswap-logo.png"
                alt=""
                width={128}
                height={128}
                className="h-14 w-14 object-contain"
              />
              <span className="text-[16px] font-bold tracking-[0.16em] text-white">
                UNSWAP
              </span>
            </Link>
            <p className="mt-7 font-display text-[26px] font-light leading-tight text-gold">
              Exchange homes.
              <br />
              Not money.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 md:col-span-7 lg:col-span-8">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
                  {column.heading}
                </h2>
                <ul className="mt-6 space-y-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-white/60 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 max-w-[760px] text-[12px] leading-[1.8] text-white/40">
          UnSwap is an independent, staff-led platform. It is not affiliated
          with, endorsed by, or formally connected to the United Nations, the
          World Bank Group, the International Monetary Fund, or any
          international organisation. All trademarks and organisation names are
          the property of their respective owners.
        </p>

        <p className="mt-8 text-[13px] text-white/45">
          © {new Date().getFullYear()} UnSwap
        </p>
      </Container>
    </footer>
  );
}
