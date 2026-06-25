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
      {/*  Navigation — navy chrome over the hero                       */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-[var(--navy)]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[72px]">
          <Logo wordClassName="text-white text-xl" />

          <nav className="hidden md:flex items-center gap-10 text-[13px] font-semibold tracking-wide uppercase text-white/65">
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

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-[13px] font-semibold text-white/80 hover:text-white transition-colors duration-200 px-2"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-bold uppercase tracking-wider text-navy bg-gold hover:bg-gold-hover px-5 py-2.5 rounded-lg transition-colors duration-200"
            >
              Request Access
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Hero — full navy, serif, left-aligned                        */}
      {/* ============================================================ */}
      <section className="relative bg-[var(--navy)] text-white overflow-hidden">
        {/* Background photograph of a member home */}
        <Image
          src="/images/hero-sovereign.png"
          alt="A bright, light-filled member home available for exchange on the UnSwap network"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Navy overlay over the image — darker on the text side, letting the
            photo breathe on the right, for brand tone + legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy)]/95 via-[var(--navy)]/85 to-[var(--navy)]/60" />
        {/* Soft light from upper-right + faint gold wash, per the concept */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_35%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(201,168,76,0.08),transparent_50%)]" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-24 pb-28 lg:pt-32 lg:pb-36">
          <div className="max-w-[760px]">
            <Eyebrow tone="light">Verified Home Exchange</Eyebrow>
            <h1 className="mt-6 font-display font-bold leading-[1.05] tracking-tight text-[clamp(2.75rem,6.5vw,5rem)]">
              Exchange Homes.
              <br />
              Not Money.
            </h1>
            <p className="mt-7 text-[17px] text-white/65 leading-[1.7] max-w-[520px]">
              The home exchange network built exclusively for UN, World Bank,
              IMF, and international organisation professionals. Eliminate
              $40,000–$80,000 a year in accommodation costs on rotation.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-navy bg-gold hover:bg-gold-hover px-8 py-4 rounded-lg transition-colors duration-200"
              >
                Request Access
              </Link>
              <a
                href="#network"
                className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-white border border-white/25 hover:border-white/60 px-8 py-4 rounded-lg transition-colors duration-200"
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 inline-flex items-center gap-3 text-white/55">
              <ShieldCheck size={18} className="text-gold" />
              <span className="text-[13px]">
                Up to <span className="text-white font-semibold">$2,000,000</span> property
                protection per exchange
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  The Exclusive Network — Core Pillars (parchment)            */}
      {/* ============================================================ */}
      <section id="network" className="bg-parchment">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-[620px] mb-14">
            <Eyebrow>The Closed Loop</Eyebrow>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.75rem] font-bold leading-tight">
              The Exclusive Network
            </h2>
            <p className="mt-4 text-[15px] text-neutral leading-relaxed">
              It is not the platform, it is the network. A verified, closed-loop
              community of diplomatic professionals that mass-market platforms
              cannot replicate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="bg-white border border-border rounded-2xl p-7 hover:border-gold/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg border border-gold/40 flex items-center justify-center mb-6">
                  <p.icon size={22} strokeWidth={1.5} className="text-gold-dark" />
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
      {/*  Featured Residences — Curated Portfolio (overlay cards)     */}
      {/* ============================================================ */}
      <section id="homes" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="flex items-center justify-center gap-5 mb-12">
            <span className="hidden sm:block h-px w-16 bg-border" />
            <Eyebrow>Curated Portfolio</Eyebrow>
            <span className="hidden sm:block h-px w-16 bg-border" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {residences.map((r) => (
              <Link
                key={r.name}
                href="/register"
                className="group relative h-80 rounded-2xl overflow-hidden border border-border"
              >
                <Image
                  src={r.img}
                  alt={`${r.name} — ${r.location}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Bottom-up navy gradient for legible serif title */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-dark)]/90 via-[var(--navy-dark)]/20 to-transparent" />

                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/95 text-navy px-3 py-1.5 rounded-md backdrop-blur-sm">
                  <BadgeCheck size={12} className="text-teal" />
                  Verified
                </span>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    {r.location}
                  </span>
                  <h3 className="mt-1.5 font-display text-2xl font-bold text-white leading-snug">
                    {r.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-[12px] text-white/70">
                    <span>{r.beds}</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-teal font-semibold">{r.duration}</span>
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
          <div className="max-w-[620px] mb-14">
            <Eyebrow>Three Steps</Eyebrow>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.75rem] font-bold leading-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
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
              <div key={s.n} className="bg-white rounded-2xl border border-border p-7">
                <span className="font-display text-5xl font-bold text-gold/30 leading-none">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.08),transparent_60%)]" />

        <div className="relative max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            {/* Left — copy + features */}
            <div>
              <Eyebrow tone="light">Trust, by Design</Eyebrow>
              <h2 className="mt-4 font-display text-3xl lg:text-[2.75rem] font-bold leading-tight">
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
                      <h3 className="font-display font-bold text-[17px]">{f.title}</h3>
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
                    <div className="text-[16px] font-bold mt-1">{card.value}</div>
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
      {/*  By the Numbers — navy stat band                              */}
      {/* ============================================================ */}
      <section className="relative bg-[var(--navy-dark)] text-white overflow-hidden">
        <Globe2
          size={300}
          strokeWidth={0.5}
          className="absolute -right-12 top-1/2 -translate-y-1/2 text-white/[0.04] hidden lg:block"
        />
        <div className="relative max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:px-6 pt-8 sm:pt-0 first:pt-0">
              <div className="font-display text-4xl lg:text-5xl font-bold text-gold">
                {s.stat}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 mt-3">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Membership Tiers                                             */}
      {/* ============================================================ */}
      <section id="pricing" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <Eyebrow>Membership</Eyebrow>
            <h2 className="mt-4 font-display text-3xl lg:text-[2.75rem] font-bold leading-tight">
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
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  t.popular ? "border-gold shadow-lg ring-1 ring-gold" : "border-border shadow-sm"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide bg-gold text-navy px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">{t.price}</span>
                  <span className="text-sm text-neutral">{t.per}</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-[13px] text-neutral-dark flex-1">
                  <li className="flex gap-2 font-semibold text-navy">
                    <ShieldCheck size={15} className="text-teal flex-shrink-0 mt-0.5" />
                    {t.exchanges}
                  </li>
                  <li className="flex gap-2 font-semibold text-navy">
                    <ShieldCheck size={15} className="text-teal flex-shrink-0 mt-0.5" />
                    {t.guarantee}
                  </li>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <ShieldCheck size={15} className="text-teal flex-shrink-0 mt-0.5" />
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
      {/*  Final CTA — Join the Network (parchment)                    */}
      {/* ============================================================ */}
      <section className="bg-parchment">
        <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
          <Eyebrow>By Invitation Only</Eyebrow>
          <h2 className="mt-4 font-display text-3xl lg:text-[2.75rem] font-bold leading-tight">
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
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-navy bg-gold hover:bg-gold-hover px-9 py-4 rounded-lg transition-colors duration-200"
            >
              Access the Network
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Non-affiliation disclaimer                                   */}
      {/* ============================================================ */}
      <div className="bg-white border-t border-border">
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
      {/*  Footer — navy, multi-column                                  */}
      {/* ============================================================ */}
      <footer className="bg-[var(--navy)] text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid gap-10 md:grid-cols-12">
            {/* Brand */}
            <div className="md:col-span-5">
              <Logo wordClassName="text-white text-lg" />
              <p className="mt-4 text-[13px] text-white/50 max-w-[320px] leading-relaxed">
                Enabling mobility. Empowering community. The verified home
                exchange network for international organisation professionals.
              </p>
            </div>

            {/* Link columns */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-4">
                  Network
                </h4>
                <ul className="space-y-2.5 text-[13px] text-white/60">
                  <li><a href="#network" className="hover:text-white transition-colors">The Network</a></li>
                  <li><a href="#homes" className="hover:text-white transition-colors">Homes</a></li>
                  <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Membership</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-4">
                  Company
                </h4>
                <ul className="space-y-2.5 text-[13px] text-white/60">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/early-access" className="hover:text-white transition-colors">Early Access</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Request Access</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-4">
                  Legal
                </h4>
                <ul className="space-y-2.5 text-[13px] text-white/60">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/45">
              © {new Date().getFullYear()} UnSwap. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-white/55">
              <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z" />
                </svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
