import Link from "next/link"
import Image from "next/image"
import {
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  Lock,
  Users,
  Home,
  FileCheck,
  Globe2,
  CreditCard,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"

export const metadata = {
  title: "UnSwap | Exchange Homes. Not Money.",
  description:
    "The verified home exchange network built exclusively for UN, World Bank, IMF, and international organisation professionals on rotation. Eliminate accommodation costs. Protect your property.",
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const pillars = [
  {
    icon: BadgeCheck,
    title: "Verified Peers",
    body: "Every member is confirmed as an active UN or international organisation professional before they can browse, list, or message. The person staying in your home is a vetted peer with as much to lose from a bad exchange as you do.",
  },
  {
    icon: Lock,
    title: "Institutional Security",
    body: "Email-domain verification, staff ID checks, and institutional employment validation create a closed-loop network that mass-market platforms cannot replicate.",
  },
  {
    icon: Users,
    title: "Private Network",
    body: "A walled garden of 100,000+ eligible professionals across 50+ duty station cities. The right community, verified and protected, is what generic platforms fail to provide.",
  },
]

const residences = [
  {
    name: "The Geneva Pavilion",
    location: "Diplomatic Quarter, Geneva",
    duration: "Available 3–6 months",
    access: "VERIFIED MEMBER",
    beds: "3 Bed · 2 Bath",
    img: "/images/residence-geneva.png",
  },
  {
    name: "Mayfair Historic Estate",
    location: "Mayfair, London",
    duration: "Available 6–18 months",
    access: "VERIFIED MEMBER",
    beds: "4 Bed · 3 Bath",
    img: "/images/residence-mayfair.png",
  },
  {
    name: "Singapore Sky Residence",
    location: "Marina Bay, Singapore",
    duration: "Available 1–3 months",
    access: "VERIFIED MEMBER",
    beds: "2 Bed · 2 Bath",
    img: "/images/residence-singapore.png",
  },
]

const trustFeatures = [
  {
    icon: FileCheck,
    title: "Legal Exchange Agreement",
    body: "Every swap generates a binding agreement covering addresses, dates, emergency contacts, house rules, and guarantee terms. Contractual protection at every exchange.",
  },
  {
    icon: CreditCard,
    title: "UnSwap Credits",
    body: "Host a colleague now, earn credits, redeem them for a stay anywhere on the network later. One night hosted equals one credit. Credits never expire.",
  },
]

const protectionCards = [
  { label: "PROPERTY GUARANTEE", value: "Up to $2,000,000", status: "COVERED" },
  { label: "CANCELLATION COVER", value: "Up to $350/night", status: "INCLUDED" },
  { label: "EXCHANGE AGREEMENT", value: "Auto-generated", status: "ACTIVE" },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="bg-white text-navy">
      {/* ============================================================ */}
      {/*  Navigation                                                   */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[72px]">
          <Logo wordClassName="text-navy text-xl" />

          <nav className="hidden md:flex items-center gap-10 text-[13px] font-semibold tracking-wide uppercase text-neutral-dark">
            <a
              href="#network"
              className="hover:text-navy transition-colors duration-200"
            >
              The Network
            </a>
            <a
              href="#homes"
              className="hover:text-navy transition-colors duration-200"
            >
              Homes
            </a>
            <a
              href="#how"
              className="hover:text-navy transition-colors duration-200"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="hover:text-navy transition-colors duration-200"
            >
              Membership
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-[13px] font-semibold text-navy hover:text-gold-dark transition-colors duration-200 px-2"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-bold uppercase tracking-wider text-white bg-gold-dark hover:bg-gold-hover px-5 py-2.5 rounded-lg transition-colors duration-200"
            >
              Request Access
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Hero                                                         */}
      {/* ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark block">
              Verified Home Exchange
            </span>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-tight">
              Exchange Homes.
              <br />
              Not Money.
            </h1>
            <p className="mt-6 text-[16px] text-neutral leading-[1.7] max-w-[480px]">
              The home exchange network built exclusively for UN, World Bank,
              IMF, and international organisation professionals. Eliminate
              $40,000–$80,000 a year in accommodation costs on rotation.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-white bg-gold-dark hover:bg-gold-hover px-7 py-3.5 rounded-lg transition-colors duration-200"
              >
                Request Access
              </Link>
              <a
                href="#network"
                className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-navy border border-border hover:border-navy px-7 py-3.5 rounded-lg transition-colors duration-200"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right — hero visual */}
          <div className="relative">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-sovereign.png"
                alt="A bright, light-filled member home available for exchange on the UnSwap network"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Floating guarantee card */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:bottom-8 lg:left-auto lg:right-[-24px] lg:translate-x-0 bg-white rounded-xl shadow-xl border border-border px-5 py-4 min-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center">
                  <ShieldCheck size={18} className="text-teal" />
                </div>
                <div>
                  <div className="font-display font-bold text-lg leading-none">
                    $2,000,000
                  </div>
                  <div className="text-[12px] text-neutral mt-1">
                    Property protection per exchange
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  The Exclusive Network — Core Pillars                         */}
      {/* ============================================================ */}
      <section
        id="network"
        className="border-y border-border bg-white"
      >
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-24">
          <div className="text-center max-w-[560px] mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
              The Closed Loop
            </span>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.5rem] font-bold leading-tight">
              The Exclusive Network
            </h2>
            <p className="mt-4 text-[15px] text-neutral leading-relaxed">
              It is not the platform, it is the network. A verified, closed-loop
              community of diplomatic professionals that mass-market platforms
              cannot replicate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
            {pillars.map((p) => (
              <div key={p.title} className="text-center px-2">
                <div className="mx-auto w-14 h-14 rounded-2xl border border-border bg-white flex items-center justify-center mb-6">
                  <p.icon
                    size={24}
                    strokeWidth={1.5}
                    className="text-navy"
                  />
                </div>
                <h3 className="font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-[14px] text-neutral leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Featured Residences                                          */}
      {/* ============================================================ */}
      <section id="homes" className="bg-background">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
                Curation
              </span>
              <h2 className="mt-3 font-display text-3xl lg:text-[2.5rem] font-bold">
                Featured Residences
              </h2>
            </div>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-dark hover:text-gold-hover transition-colors uppercase tracking-wide"
            >
              View Collection <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {residences.map((r) => (
              <div
                key={r.name}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={r.img}
                    alt={`${r.name} — ${r.location}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/95 text-navy px-3 py-1.5 rounded-md backdrop-blur-sm">
                    <BadgeCheck size={12} className="text-teal" />
                    Verified
                  </span>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold leading-snug">
                    {r.name}
                  </h3>
                  <p className="text-[13px] text-neutral mt-1">
                    {r.location} · {r.beds}
                  </p>

                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-dark">
                      {r.access}
                    </span>
                    <span className="text-[13px] font-semibold text-teal">
                      {r.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  How It Works — 3 Steps                                       */}
      {/* ============================================================ */}
      <section id="how" className="bg-white border-y border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-24">
          <div className="text-center max-w-[560px] mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
              Three Steps
            </span>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.5rem] font-bold leading-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Verify your status",
                body: "Sign up with your institutional email. Recognised domains like @un.org and @worldbank.org are fast-tracked. Upload your staff ID for full verification.",
              },
              {
                n: "02",
                title: "List your home",
                body: "Publish your property with photos, swap duration preferences, and house rules. Your home becomes a living asset instead of an empty liability on rotation.",
              },
              {
                n: "03",
                title: "Exchange and save",
                body: "Swap simultaneously with a peer, or host now and earn UnSwap Credits for later. Sign the exchange agreement and travel protected — up to $2,000,000.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="relative bg-background rounded-2xl border border-border p-7"
              >
                <span className="font-display text-5xl font-bold text-gold/25 leading-none">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">
                  {s.title}
                </h3>
                <p className="mt-3 text-[14px] text-neutral leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Trust & Protection — Dark Section                            */}
      {/* ============================================================ */}
      <section className="relative bg-navy text-white overflow-hidden">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.08),transparent_60%)]" />

        <div className="relative max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            {/* Left — copy + features */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
                Trust, by Design
              </span>
              <h2 className="mt-4 font-display text-3xl lg:text-[2.5rem] font-bold leading-tight">
                Built on Institutional
                <br />
                Trust. Protected by Design.
              </h2>
              <p className="mt-5 text-[15px] text-white/55 leading-[1.7] max-w-[440px]">
                The person staying in your home is not a stranger with a
                five-star review. They are a vetted diplomatic professional with
                as much to lose from a poor exchange as you do. That is the
                closed loop.
              </p>

              <div className="mt-10 space-y-5">
                {trustFeatures.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gold/15 text-gold flex items-center justify-center">
                      <f.icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[17px]">
                        {f.title}
                      </h3>
                      <p className="text-[13px] text-white/50 mt-1 leading-relaxed">
                        {f.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — protection cards */}
            <div className="space-y-4 lg:pt-12">
              {protectionCards.map((card) => (
                <div
                  key={card.label}
                  className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-6 py-5"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {card.label}
                    </div>
                    <div className="text-[16px] font-bold mt-1">
                      {card.value}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-3 py-1.5 rounded-md">
                    {card.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Membership Tiers                                             */}
      {/* ============================================================ */}
      <section id="pricing" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-24">
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
              Membership
            </span>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.5rem] font-bold leading-tight">
              Choose Your Tier
            </h2>
            <p className="mt-4 text-[15px] text-neutral">
              One annual membership. Exchanges scaled to how often you rotate.
              Every tier includes verified peer access and property protection.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: "Limited 1X",
                price: "$129",
                per: "/yr",
                exchanges: "1 exchange per year",
                guarantee: "$500,000 property guarantee",
                features: [
                  "Verified peer network",
                  "Exchange agreement",
                  "Email support",
                ],
              },
              {
                name: "Standard 2X",
                price: "$219",
                per: "/yr",
                exchanges: "2 exchanges per year",
                guarantee: "$1,000,000 property guarantee",
                features: [
                  "Verified peer network",
                  "Exchange agreement",
                  "UnSwap Credits",
                ],
              },
              {
                name: "Professional 4X",
                price: "$349",
                per: "/yr",
                exchanges: "4 exchanges per year",
                guarantee: "$1,500,000 property guarantee",
                popular: true,
                features: [
                  "Verified peer network",
                  "Exchange agreement",
                  "UnSwap Credits",
                  "Priority matching",
                ],
              },
              {
                name: "Unlimited Pro",
                price: "$449",
                per: "/yr",
                exchanges: "Unlimited exchanges",
                guarantee: "$2,000,000 + priority support",
                features: [
                  "Everything in Professional",
                  "Priority support",
                  "Premium placement",
                  "Unlimited credits",
                ],
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  t.popular
                    ? "border-gold shadow-lg ring-1 ring-gold"
                    : "border-border shadow-sm"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide bg-gold text-navy px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">
                    {t.price}
                  </span>
                  <span className="text-sm text-neutral">{t.per}</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-[13px] text-neutral-dark flex-1">
                  <li className="flex gap-2 font-semibold text-navy">
                    <ShieldCheck
                      size={15}
                      className="text-teal flex-shrink-0 mt-0.5"
                    />
                    {t.exchanges}
                  </li>
                  <li className="flex gap-2 font-semibold text-navy">
                    <ShieldCheck
                      size={15}
                      className="text-teal flex-shrink-0 mt-0.5"
                    />
                    {t.guarantee}
                  </li>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <ShieldCheck
                        size={15}
                        className="text-teal flex-shrink-0 mt-0.5"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 text-center text-[13px] font-bold uppercase tracking-wider py-3 rounded-lg transition-colors duration-200 ${
                    t.popular
                      ? "bg-gold-dark text-white hover:bg-gold-hover"
                      : "border border-border text-navy hover:border-navy"
                  }`}
                >
                  Request Access
                </Link>
              </div>
            ))}
          </div>

          {/* Lifetime banner */}
          <div className="mt-6 rounded-2xl bg-navy text-white p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-gold/15 text-gold flex items-center justify-center">
                <BadgeCheck size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">
                    Lifetime Access
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-gold text-navy px-2.5 py-1 rounded-full">
                    Best Value
                  </span>
                </div>
                <p className="text-[13px] text-white/55 mt-1">
                  Unlimited exchanges forever. $2,000,000 protection. Priority
                  support. One payment, career-long membership.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="font-display text-2xl font-bold">$3,143</div>
                <div className="text-[11px] text-white/45">one-time</div>
              </div>
              <Link
                href="/register"
                className="text-[13px] font-bold uppercase tracking-wider text-navy bg-gold hover:bg-gold-hover px-6 py-3 rounded-lg transition-colors duration-200 whitespace-nowrap"
              >
                Claim Lifetime
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  The Financial Wake-Up — Stats Bar                            */}
      {/* ============================================================ */}
      <section className="border-y border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: "$110", label: "Average daily cost without UnSwap" },
            { stat: "50+", label: "Duty station cities covered" },
            { stat: "100,000+", label: "Eligible IO professionals globally" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl lg:text-4xl font-bold text-navy">
                {s.stat}
              </div>
              <div className="text-[13px] text-neutral mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Final CTA — Join the Network                                 */}
      {/* ============================================================ */}
      <section className="bg-white">
        <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
            By Invitation Only
          </span>
          <h2 className="mt-4 font-display text-3xl lg:text-[2.5rem] font-bold leading-tight">
            Join the Network
          </h2>
          <p className="mt-5 text-[15px] text-neutral leading-[1.7] max-w-[520px] mx-auto">
            Begin your verification today. Turn an empty home into your most
            valuable asset on rotation. Stop paying $110 a day for accommodation
            your peers could provide for free.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-white bg-gold-dark hover:bg-gold-hover px-9 py-4 rounded-lg transition-colors duration-200"
            >
              Access the Network
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Non-affiliation disclaimer                                   */}
      {/* ============================================================ */}
      <div className="bg-background border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <p className="text-[11px] text-neutral text-center leading-relaxed">
            UnSwap is an independent, staff-led platform. It is not affiliated
            with, endorsed by, or formally connected to the United Nations, the
            World Bank Group, the International Monetary Fund, or any
            international organisation. All trademarks and organisation names
            are the property of their respective owners.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-white/10 bg-[var(--navy)] text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Left — logo + legal */}
            <div>
              <Logo wordClassName="text-white text-lg" />
              <p className="mt-3 text-[12px] text-white/50 max-w-[360px] leading-relaxed">
                Enabling Mobility. Empowering Community.
                <br />© {new Date().getFullYear()} UnSwap. All rights reserved.
              </p>
            </div>

            {/* Centre — links */}
            <nav className="flex flex-wrap gap-6 text-[12px] font-medium text-white/60">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <a
                href="#how"
                className="hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#network"
                className="hover:text-white transition-colors"
              >
                The Network
              </a>
              <Link
                href="/early-access"
                className="hover:text-white transition-colors"
              >
                Early Access
              </Link>
            </nav>

            {/* Right — social icons */}
            <div className="flex items-center gap-4 text-white/60">
              <a
                href="#"
                aria-label="LinkedIn"
                className="hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="X (Twitter)"
                className="hover:text-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
