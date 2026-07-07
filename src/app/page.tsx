import Link from "next/link"
import Image from "next/image"
import {
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  Lock,
  Users,
  FileCheck,
  Globe2,
  CreditCard,
  Home,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
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

const stats = [
  { stat: "$110", label: "Average daily cost without UnSwap" },
  { stat: "50+", label: "Duty station cities covered" },
  { stat: "100,000+", label: "Eligible IO professionals globally" },
]

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <span
      className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
        tone === "light" ? "text-gold" : "text-gold-dark"
      }`}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="bg-white text-navy">
      {/* ============================================================ */}
      {/*  Navigation — floating glass pill                             */}
      {/* ============================================================ */}
      <header className="fixed top-4 sm:top-6 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-[var(--navy)]/85 backdrop-blur-xl border border-white/10 rounded-full h-20 px-5 sm:px-8 flex items-center justify-between shadow-2xl">
            <Logo wordClassName="text-white" />

            <nav className="hidden md:flex items-center gap-10 text-[12px] font-bold tracking-[0.15em] uppercase text-white/70">
              <a href="#network" className="hover:text-white transition-colors duration-200">
                The Network
              </a>
              <a href="#homes" className="hover:text-white transition-colors duration-200">
                Homes
              </a>
              <a href="#how" className="hover:text-white transition-colors duration-200">
                How It Works
              </a>
              <a href="#pricing" className="hover:text-white transition-colors duration-200">
                Membership
              </a>
            </nav>

            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/login"
                className="hidden sm:inline-block text-[12px] font-bold uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-200"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex text-[12px] font-bold uppercase tracking-wider text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-6 py-3 rounded-full transition-colors duration-200"
              >
                Request Access
              </Link>
              <Link
                href="/login"
                className="sm:hidden text-[12px] font-bold uppercase tracking-wider text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-5 py-2.5 rounded-full transition-colors duration-200"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Hero — full navy, serif, centered                           */}
      {/* ============================================================ */}
      <section className="relative bg-[var(--navy)] text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          {/* Reliable CDN video to avoid hotlinking protection */}
          <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay to ensure text legibility while maintaining brand color */}
        <div className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-[2px]" />
        
        {/* Soft light from upper-right + faint gold wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative w-full max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center text-center mt-10">
          <h1 className="font-display font-bold leading-[1.05] tracking-tight text-[clamp(3rem,7vw,5.5rem)] text-balance">
            Exchange Homes.<br />Not Money.
          </h1>
          
          <p className="mt-8 text-[17px] md:text-[19px] text-white/90 leading-[1.6] max-w-[640px]">
            The home exchange network built exclusively for UN, World Bank,
            IMF, and international organisation professionals. Eliminate
            $40,000–$80,000 a year in accommodation costs on rotation.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-10 py-4 rounded-full transition-colors duration-200"
            >
              Request Access
            </Link>
            <a
              href="#network"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-white border border-white/40 hover:border-white hover:bg-white/10 px-10 py-4 rounded-full transition-colors duration-200 backdrop-blur-md bg-white/5"
            >
              Learn More
            </a>
          </div>

          {/* Trust Banner inline */}
          <div className="mt-16 sm:mt-24 inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-white/80 text-[13px] md:text-[14px] font-medium backdrop-blur-md bg-[var(--navy-dark)]/40 px-6 py-3.5 rounded-2xl sm:rounded-full border border-white/10 shadow-xl">
            <span className="flex items-center gap-2.5">
              <Globe2 size={18} className="text-[var(--gold)]" />
              100,000+ eligible professionals globally
            </span>
            <span className="w-px h-5 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-[var(--teal)]" />
              Up to $2,000,000 property protection
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  The Exclusive Network — Core Pillars (parchment)            */}
      {/* ============================================================ */}
      <section id="network" className="bg-parchment">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-[620px] mb-14">
            <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold text-[var(--navy)] leading-tight">
              The Exclusive Network
            </h2>
            <p className="mt-4 text-[15px] text-neutral leading-relaxed">
              It is not the platform, it is the network. A verified, closed-loop
              community of diplomatic professionals that mass-market platforms
              cannot replicate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {pillars.map((p, i) => {
              const bgColors = ["bg-blue-500/10", "bg-[var(--gold)]/15", "bg-[var(--teal)]/15"];
              const iconColors = ["text-blue-500", "text-[var(--gold-dark)]", "text-[var(--teal)]"];
              return (
                <div
                  key={p.title}
                  className="bg-white border border-[var(--border)] rounded-[24px] p-8 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow duration-300"
                >
                  <div className={`w-20 h-20 rounded-full ${bgColors[i]} flex items-center justify-center mb-8`}>
                    <p.icon size={36} strokeWidth={1.5} className={iconColors[i]} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[var(--navy)] leading-snug">{p.title}</h3>
                  <p className="mt-4 text-[15px] text-neutral leading-[1.6]">
                    {p.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Featured Residences — Curated Portfolio (overlay cards)     */}
      {/* ============================================================ */}
      <section id="homes" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold text-[var(--navy)] leading-tight">
              Curated Portfolio
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {residences.map((r) => (
              <Link
                key={r.name}
                href="/register"
                className="group relative h-[380px] rounded-[24px] overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <Image
                  src={r.img}
                  alt={`${r.name} — ${r.location}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Bottom-up navy gradient for legible serif title */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-dark)]/90 via-[var(--navy-dark)]/30 to-transparent" />

                <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-white/95 text-[var(--navy)] px-3.5 py-2 rounded-lg backdrop-blur-md shadow-sm">
                  <BadgeCheck size={14} className="text-[var(--teal)]" />
                  Verified
                </span>

                <div className="absolute inset-x-0 bottom-0 p-8">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
                    {r.location}
                  </span>
                  <h3 className="mt-1.5 font-display text-2xl font-bold text-white leading-snug">
                    {r.name}
                  </h3>
                  <div className="mt-4 flex items-center gap-3 text-[13px] text-white/70">
                    <span>{r.beds}</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-[var(--teal)] font-semibold">{r.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-navy border-b border-gold pb-1 hover:text-gold-dark transition-colors"
            >
              View Complete Inventory <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  How It Works — 3 Steps (parchment)                          */}
      {/* ============================================================ */}
      <section id="how" className="bg-parchment">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold text-[var(--navy)] leading-tight">
              How does it work?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {[
              {
                n: "1",
                icon: BadgeCheck,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                title: "Verify your status",
                body: "Sign up with your institutional email. Recognised domains like @un.org and @worldbank.org are fast-tracked. Upload your staff ID for full verification.",
              },
              {
                n: "2",
                icon: Home,
                color: "text-[var(--gold-dark)]",
                bg: "bg-[var(--gold)]/15",
                title: "List your home",
                body: "Publish your property with photos, swap duration preferences, and house rules. Your home becomes a living asset instead of an empty liability on rotation.",
              },
              {
                n: "3",
                icon: Globe2,
                color: "text-[var(--teal)]",
                bg: "bg-[var(--teal)]/15",
                title: "Exchange and save",
                body: "Swap simultaneously with a peer, or host now and earn UnSwap Credits for later. Sign the exchange agreement and travel protected — up to $2,000,000.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-[24px] border border-[var(--border)] p-8 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow duration-300">
                {/* Header: Circle number and line */}
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center font-display text-lg font-medium text-[var(--navy)] shrink-0">
                    {s.n}
                  </div>
                  <div className="h-px bg-[var(--border)] flex-1" />
                </div>
                
                {/* Illustration (Icon lockup) */}
                <div className="flex items-center justify-center py-14">
                  <div className={`w-32 h-32 rounded-full ${s.bg} flex items-center justify-center`}>
                    <s.icon size={64} strokeWidth={1.5} className={s.color} />
                  </div>
                </div>

                {/* Text Content */}
                <div className="mt-auto">
                  <h3 className="font-display text-2xl font-bold text-[var(--navy)] leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-[15px] text-neutral leading-[1.6]">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Trust & Protection — Floating Dark Card                      */}
      {/* ============================================================ */}
      <section className="bg-parchment py-10 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="relative bg-[var(--navy)] text-white rounded-[32px] overflow-hidden shadow-2xl border border-[var(--navy-dark)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.12),transparent_70%)]" />

            <div className="relative px-8 py-20 lg:p-24">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                {/* Left — copy + features */}
                <div>
                  <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold leading-tight">
                    Built on Institutional
                    <br />
                    Trust. Protected by Design.
                  </h2>
                  <p className="mt-6 text-[17px] text-white/60 leading-[1.7] max-w-[480px]">
                    The person staying in your home is not a stranger with a
                    five-star review. They are a vetted diplomatic professional with
                    as much to lose from a poor exchange as you do. That is the
                    closed loop.
                  </p>

                  <div className="mt-12 space-y-6">
                    {trustFeatures.map((f) => (
                      <div key={f.title} className="flex gap-5 items-start">
                        <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white/5 text-[var(--gold)] flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner">
                          <f.icon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-[20px] text-white">{f.title}</h3>
                          <p className="text-[15px] text-white/50 mt-1.5 leading-[1.6]">
                            {f.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — protection cards */}
                <div className="space-y-4 lg:pl-10">
                  {protectionCards.map((card) => (
                    <div
                      key={card.label}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 rounded-[24px] p-7 backdrop-blur-md shadow-lg"
                    >
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]/80">
                          {card.label}
                        </div>
                        <div className="text-[20px] font-display font-bold mt-1 text-white">{card.value}</div>
                      </div>
                      <span className="inline-flex text-[11px] font-bold uppercase tracking-wider text-[var(--teal)] bg-[var(--teal)]/10 px-4 py-2 rounded-lg self-start sm:self-auto border border-[var(--teal)]/20">
                        {card.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  By the Numbers — clean grid                                  */}
      {/* ============================================================ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-parchment rounded-[24px] p-10 text-center border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="font-display text-5xl lg:text-6xl font-bold text-[var(--navy)]">
                  {s.stat}
                </div>
                <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral mt-4">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Membership Tiers                                             */}
      {/* ============================================================ */}
      <section id="pricing" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold text-[var(--navy)] leading-tight">
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
                features: ["Verified peer network", "Exchange agreement", "Email support"],
              },
              {
                name: "Standard 2X",
                price: "$219",
                per: "/yr",
                exchanges: "2 exchanges per year",
                guarantee: "$1,000,000 property guarantee",
                features: ["Verified peer network", "Exchange agreement", "UnSwap Credits"],
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
                className={`relative rounded-[24px] border p-8 flex flex-col transition-all duration-300 ${
                  t.popular ? "border-[var(--gold)] shadow-[0_8px_30px_rgb(201,168,76,0.15)] ring-1 ring-[var(--gold)] scale-[1.02] bg-white z-10" : "border-[var(--border)] shadow-sm hover:shadow-md bg-white"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wide bg-[var(--gold)] text-[var(--navy)] px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-[var(--navy)]">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--navy)]">{t.price}</span>
                  <span className="text-sm text-neutral">{t.per}</span>
                </div>
                <ul className="mt-6 space-y-3 text-[14px] text-neutral-dark flex-1">
                  <li className="flex gap-3 font-semibold text-[var(--navy)] items-start">
                    <ShieldCheck size={18} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
                    {t.exchanges}
                  </li>
                  <li className="flex gap-3 font-semibold text-[var(--navy)] items-start">
                    <ShieldCheck size={18} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
                    {t.guarantee}
                  </li>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 items-start">
                      <ShieldCheck size={18} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 text-center text-[14px] font-bold uppercase tracking-wider py-4 rounded-xl transition-colors duration-200 ${
                    t.popular
                      ? "bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-hover)]"
                      : "border border-[var(--border)] text-[var(--navy)] hover:border-[var(--navy)]"
                  }`}
                >
                  Request Access
                </Link>
              </div>
            ))}
          </div>

          {/* Lifetime banner */}
          <div className="mt-10 rounded-[32px] bg-[var(--navy)] text-white p-8 lg:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl border border-[var(--navy-dark)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <span className="w-16 h-16 rounded-2xl bg-white/5 text-[var(--gold)] flex items-center justify-center border border-white/10 shrink-0">
                <BadgeCheck size={32} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">Lifetime Access</h3>
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
      {/*  Final CTA — Join the Network                               */}
      {/* ============================================================ */}
      <section className="bg-parchment">
        <div className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="bg-white rounded-[32px] border border-[var(--border)] p-12 md:p-20 text-center shadow-sm max-w-[800px] mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[var(--gold)]/15 flex items-center justify-center mb-8">
               <ShieldCheck size={40} className="text-[var(--gold-dark)]" />
            </div>
            <h2 className="font-display text-4xl lg:text-[3.25rem] font-bold text-[var(--navy)] leading-tight">
              Join the Network
            </h2>
            <p className="mt-6 text-[17px] text-neutral leading-[1.6] max-w-[520px]">
              Begin your verification today. Turn an empty home into your most
              valuable asset on rotation. Stop paying $110 a day for accommodation
              your peers could provide for free.
            </p>
            <div className="mt-12">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-[15px] font-bold uppercase tracking-wider text-[var(--navy)] bg-[var(--gold)] hover:bg-[var(--gold-hover)] px-10 py-4 rounded-full transition-colors duration-200"
              >
                Access the Network
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Non-affiliation disclaimer                                   */}
      {/* ============================================================ */}
      <section className="bg-parchment pb-32">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="bg-white border border-[var(--border)] rounded-[24px] p-8 md:p-10 text-center shadow-sm">
            <p className="text-[13px] md:text-[14px] text-neutral leading-[1.8]">
              UnSwap is an independent, staff-led platform. It is not affiliated
              with, endorsed by, or formally connected to the United Nations, the
              World Bank Group, the International Monetary Fund, or any
              international organisation. All trademarks and organisation names
              are the property of their respective owners.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Footer — navy, multi-column                                  */}
      {/* ============================================================ */}
      <footer className="bg-[var(--navy)] text-white rounded-t-[48px] -mt-12 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-12">
          <div className="grid gap-12 md:grid-cols-12 lg:gap-8 border-b border-white/10 pb-16">
            {/* Brand */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col">
              <Logo wordClassName="text-white" />
              <p className="mt-6 text-[14px] text-white/50 max-w-[320px] leading-[1.8]">
                Enabling mobility. Empowering community. The verified home
                exchange network for international organisation professionals.
              </p>
            </div>

            {/* Link columns */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-6">
                  Network
                </h4>
                <ul className="space-y-4 text-[14px] text-white/60">
                  <li><a href="#network" className="hover:text-white transition-colors">The Network</a></li>
                  <li><a href="#homes" className="hover:text-white transition-colors">Homes</a></li>
                  <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Membership</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-6">
                  Company
                </h4>
                <ul className="space-y-4 text-[14px] text-white/60">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/early-access" className="hover:text-white transition-colors">Early Access</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Request Access</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-6">
                  Legal
                </h4>
                <ul className="space-y-4 text-[14px] text-white/60">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-[13px] text-white/45">
              © {new Date().getFullYear()} UnSwap. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-white/50">
              <a href="#" aria-label="X (Twitter)" className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Facebook" className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Linkedin size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
