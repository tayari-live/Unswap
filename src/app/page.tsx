import Link from "next/link"
import Image from "next/image"
import {
  ShieldCheck, BadgeCheck, ArrowRight, Lock, Users, FileCheck, Globe2, CreditCard, Home,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { LandingNavbar } from "@/components/layout/landing-navbar"

export const metadata = {
  title: "UnSwap | Exchange Homes. Not Money.",
  description:
    "The verified home exchange network built exclusively for UN, World Bank, IMF, and international organisation professionals on rotation. Eliminate accommodation costs. Protect your property.",
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const pillars = [
  { icon: BadgeCheck, title: "Verified Peers", body: "Every member is confirmed as an active UN or international organisation professional before they can browse, list, or message. The person staying in your home is a vetted peer with as much to lose from a bad exchange as you do." },
  { icon: Lock, title: "Institutional Security", body: "Email-domain verification, staff ID checks, and institutional employment validation create a closed-loop network that mass-market platforms cannot replicate." },
  { icon: Users, title: "Private Network", body: "A walled garden of 100,000+ eligible professionals across 50+ duty station cities. The right community, verified and protected, is what generic platforms fail to provide." },
]

const residences = [
  { name: "The Geneva Pavilion", location: "Diplomatic Quarter, Geneva", duration: "Available 3–6 months", beds: "3 Bed · 2 Bath", img: "/images/residence-geneva.png" },
  { name: "Mayfair Historic Estate", location: "Mayfair, London", duration: "Available 6–18 months", beds: "4 Bed · 3 Bath", img: "/images/residence-mayfair.png" },
  { name: "Singapore Sky Residence", location: "Marina Bay, Singapore", duration: "Available 1–3 months", beds: "2 Bed · 2 Bath", img: "/images/residence-singapore.png" },
]

const trustFeatures = [
  { icon: FileCheck, title: "Legal Exchange Agreement", body: "Every swap generates a binding agreement covering addresses, dates, emergency contacts, house rules, and guarantee terms. Contractual protection at every exchange." },
  { icon: CreditCard, title: "UnSwap Credits", body: "Host a colleague now, earn credits, redeem them for a stay anywhere on the network later. One night hosted equals one credit. Credits never expire." },
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

const steps = [
  { n: "01", icon: BadgeCheck, title: "Verify your status", body: "Sign up with your institutional email. Recognised domains like @un.org and @worldbank.org are fast-tracked. Upload your staff ID for full verification." },
  { n: "02", icon: Home, title: "List your home", body: "Publish your property with photos, swap duration preferences, and house rules. Your home becomes a living asset instead of an empty liability on rotation." },
  { n: "03", icon: Globe2, title: "Exchange and save", body: "Swap simultaneously with a peer, or host now and earn UnSwap Credits for later. Sign the exchange agreement and travel protected, up to $2,000,000." },
]

const tiers = [
  { name: "Limited 1X", price: "$129", per: "/yr", exchanges: "1 exchange per year", guarantee: "$500,000 property guarantee", features: ["Verified peer network", "Exchange agreement", "Email support"] },
  { name: "Standard 2X", price: "$219", per: "/yr", exchanges: "2 exchanges per year", guarantee: "$1,000,000 property guarantee", features: ["Verified peer network", "Exchange agreement", "UnSwap Credits"] },
  { name: "Professional 4X", price: "$349", per: "/yr", exchanges: "4 exchanges per year", guarantee: "$1,500,000 property guarantee", popular: true, features: ["Verified peer network", "Exchange agreement", "UnSwap Credits", "Priority matching"] },
  { name: "Unlimited Pro", price: "$449", per: "/yr", exchanges: "Unlimited exchanges", guarantee: "$2,000,000 + priority support", features: ["Everything in Professional", "Priority support", "Premium placement", "Unlimited credits"] },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

// Gold "line — LABEL — line" eyebrow, matching the waitlist/auth pages.
function SectionLabel({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return (
    <div className={`flex items-center gap-3 mb-5 ${align === "center" ? "justify-center" : ""}`}>
      {align === "center" && <div className="h-px w-14 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.45)]" />}
      <span className="text-[11px] tracking-[0.28em] uppercase font-medium text-gold-ink">{children}</span>
      <div className="h-px w-14 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.45)]" />
    </div>
  )
}

const GOLD_BTN =
  "inline-flex justify-center items-center gap-2 text-[13px] font-medium uppercase tracking-[0.1em] text-ink bg-gold hover:bg-gold-light px-9 py-4 transition-colors duration-200"
const GHOST_BTN =
  "inline-flex justify-center items-center gap-2 text-[13px] font-medium uppercase tracking-[0.1em] text-white border border-white/30 hover:border-gold hover:text-gold-light px-9 py-4 transition-colors duration-200"

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="bg-cream text-ink font-sans">
      <LandingNavbar />

      {/* ── HERO — deep navy, video ── */}
      <section className="relative bg-ink text-white overflow-hidden min-h-[92vh] flex items-center">
        <video autoPlay loop muted playsInline preload="auto" poster="/images/hero-poster.jpg" className="absolute inset-0 w-full h-full object-cover opacity-70">
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/80 via-[#0a0e1a]/45 to-[#0a0e1a]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.12),transparent_60%)]" />

        <div className="relative w-full max-w-[1100px] mx-auto px-6 py-24 flex flex-col items-center text-center mt-8">
          <SectionLabel>By Invitation · Verified Access</SectionLabel>
          <h1 className="font-display font-light leading-[1.04] tracking-[-0.02em] text-[clamp(3rem,7vw,5.5rem)] text-balance">
            Exchange Homes.<br />
            <span className="text-gold-light italic font-light">Not Money.</span>
          </h1>
          <p className="mt-8 text-[17px] md:text-[19px] text-white/80 leading-[1.7] max-w-[620px] font-light">
            The home exchange network built exclusively for UN, World Bank, IMF, and international organisation professionals. Eliminate $40,000 to $80,000 a year in accommodation costs on rotation.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/register" className={`${GOLD_BTN} w-full sm:w-auto shadow-[0_4px_28px_rgba(201,168,76,0.3)]`}>Request Access</Link>
            <a href="#network" className={`${GHOST_BTN} w-full sm:w-auto`}>Learn More</a>
          </div>
          <div className="mt-16 sm:mt-20 inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-white/75 text-[13px] font-light">
            <span className="flex items-center gap-2.5"><Globe2 size={17} className="text-gold" /> 100,000+ eligible professionals globally</span>
            <span className="w-px h-4 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2.5"><ShieldCheck size={17} className="text-gold" /> Up to $2,000,000 property protection</span>
          </div>
        </div>
      </section>

      {/* ── THE EXCLUSIVE NETWORK — cream ── */}
      <section id="network" className="bg-cream">
        <div className="max-w-[1160px] mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-[640px] mb-16">
            <SectionLabel align="left">The Network</SectionLabel>
            <h2 className="font-display text-[40px] lg:text-[48px] font-semibold text-ink leading-[1.1]">The Exclusive Network</h2>
            <p className="mt-5 text-[15px] text-[rgba(10,14,26,0.6)] leading-relaxed">
              It is not the platform, it is the network. A verified, closed-loop community of diplomatic professionals that mass-market platforms cannot replicate.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[rgba(201,168,76,0.25)] border border-[rgba(201,168,76,0.25)]">
            {pillars.map((p) => (
              <div key={p.title} className="bg-white p-9 lg:p-10 flex flex-col h-full">
                <div className="w-16 h-16 border border-[rgba(201,168,76,0.4)] flex items-center justify-center mb-8">
                  <p.icon size={28} strokeWidth={2} className="text-gold-ink" />
                </div>
                <h3 className="font-display text-2xl font-light text-ink leading-snug">{p.title}</h3>
                <p className="mt-4 text-[15px] text-[rgba(10,14,26,0.6)] leading-[1.7]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURATED PORTFOLIO — deep navy ── */}
      <section id="homes" className="bg-ink text-white">
        <div className="max-w-[1160px] mx-auto px-6 py-24 lg:py-32">
          <div className="text-center mb-16">
            <SectionLabel>The Residences</SectionLabel>
            <h2 className="font-display text-[40px] lg:text-[48px] font-semibold leading-[1.1]">Curated Portfolio</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {residences.map((r) => (
              <Link key={r.name} href="/register" className="group relative h-[420px] overflow-hidden border border-white/10 hover:border-[rgba(201,168,76,0.5)] transition-colors duration-300">
                <Image src={r.img} alt={`${r.name} — ${r.location}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/30 to-transparent" />
                <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] bg-ink/70 text-gold-light px-3 py-1.5 border border-[rgba(201,168,76,0.3)] backdrop-blur-sm">
                  <BadgeCheck size={13} /> Verified
                </span>
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{r.location}</span>
                  <h3 className="mt-2 font-display text-[26px] font-light text-white leading-snug">{r.name}</h3>
                  <div className="mt-3 flex items-center gap-3 text-[13px] text-white/60">
                    <span>{r.beds}</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="text-gold">{r.duration}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white border-b border-gold pb-1 hover:text-gold-light transition-colors">
              View Complete Inventory <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — cream ── */}
      <section id="how" className="bg-cream">
        <div className="max-w-[1160px] mx-auto px-6 py-24 lg:py-32">
          <div className="text-center mb-16">
            <SectionLabel>The Process</SectionLabel>
            <h2 className="font-display text-[40px] lg:text-[48px] font-semibold text-ink leading-[1.1]">How does it work?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[rgba(201,168,76,0.25)] border border-[rgba(201,168,76,0.25)]">
            {steps.map((s) => (
              <div key={s.n} className="bg-white p-9 lg:p-10 flex flex-col h-full">
                <div className="flex items-center gap-4 w-full">
                  <span className="font-display text-3xl font-light text-gold">{s.n}</span>
                  <div className="h-px bg-[rgba(201,168,76,0.3)] flex-1" />
                </div>
                <div className="flex items-center justify-center py-12">
                  <div className="w-28 h-28 rounded-full border border-[rgba(201,168,76,0.35)] flex items-center justify-center">
                    <s.icon size={52} strokeWidth={2} className="text-gold-ink" />
                  </div>
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-2xl font-light text-ink leading-snug">{s.title}</h3>
                  <p className="mt-4 text-[15px] text-[rgba(10,14,26,0.6)] leading-[1.7]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST & PROTECTION — deep navy ── */}
      <section className="bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.1),transparent_65%)]" />
        <div className="relative max-w-[1160px] mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div>
              <SectionLabel align="left">Protected by Design</SectionLabel>
              <h2 className="font-display text-[40px] lg:text-[48px] font-semibold leading-[1.12]">Built on Institutional Trust.</h2>
              <p className="mt-6 text-[17px] text-white/60 leading-[1.8] max-w-[480px] font-light">
                The person staying in your home is not a stranger with a five-star review. They are a vetted diplomatic professional with as much to lose from a poor exchange as you do. That is the closed loop.
              </p>
              <div className="mt-12 space-y-8">
                {trustFeatures.map((f) => (
                  <div key={f.title} className="flex gap-5 items-start">
                    <div className="w-12 h-12 flex-shrink-0 border border-[rgba(201,168,76,0.3)] text-gold flex items-center justify-center">
                      <f.icon size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-display font-light text-[21px] text-white">{f.title}</h3>
                      <p className="text-[15px] text-white/50 mt-1.5 leading-[1.7]">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 lg:pl-10">
              {protectionCards.map((card) => (
                <div key={card.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 p-7 backdrop-blur-md">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold/80">{card.label}</div>
                    <div className="text-[22px] font-display font-light mt-1.5 text-white">{card.value}</div>
                  </div>
                  <span className="inline-flex text-[10px] font-medium uppercase tracking-[0.15em] text-gold-light border border-[rgba(201,168,76,0.3)] px-4 py-2 self-start sm:self-auto">{card.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BY THE NUMBERS — cream ── */}
      <section className="bg-cream">
        <div className="max-w-[1160px] mx-auto px-6 py-20 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(201,168,76,0.25)] border border-[rgba(201,168,76,0.25)]">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-12 text-center">
                <div className="font-display text-5xl lg:text-6xl font-bold text-ink">{s.stat}</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[rgba(10,14,26,0.55)] mt-4">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP TIERS — cream ── */}
      <section id="pricing" className="bg-cream">
        <div className="max-w-[1160px] mx-auto px-6 py-24 lg:py-32">
          <div className="text-center max-w-[560px] mx-auto mb-16">
            <SectionLabel>Membership</SectionLabel>
            <h2 className="font-display text-[40px] lg:text-[48px] font-semibold text-ink leading-[1.1]">Choose Your Tier</h2>
            <p className="mt-5 text-[15px] text-[rgba(10,14,26,0.6)]">
              One annual membership. Exchanges scaled to how often you rotate. Every tier includes verified peer access and property protection.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((t) => (
              <div key={t.name} className={`relative p-8 flex flex-col bg-white transition-all duration-300 ${t.popular ? "border-2 border-gold shadow-[0_12px_40px_rgba(201,168,76,0.18)] lg:scale-[1.03] z-10" : "border border-[rgba(201,168,76,0.25)] hover:border-[rgba(201,168,76,0.55)]"}`}>
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.15em] bg-gold text-ink px-4 py-1.5 whitespace-nowrap">Most Popular</span>
                )}
                <h3 className="font-display text-xl font-light text-ink">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-ink">{t.price}</span>
                  <span className="text-sm text-[rgba(10,14,26,0.5)]">{t.per}</span>
                </div>
                <ul className="mt-6 space-y-3 text-[14px] text-[rgba(10,14,26,0.65)] flex-1">
                  <li className="flex gap-3 font-medium text-ink items-start"><ShieldCheck size={17} className="text-gold flex-shrink-0 mt-0.5" />{t.exchanges}</li>
                  <li className="flex gap-3 font-medium text-ink items-start"><ShieldCheck size={17} className="text-gold flex-shrink-0 mt-0.5" />{t.guarantee}</li>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 items-start"><ShieldCheck size={17} className="text-gold flex-shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-8 text-center text-[12px] font-medium uppercase tracking-[0.1em] py-4 transition-colors duration-200 ${t.popular ? "bg-gold text-ink hover:bg-gold-light" : "border border-[rgba(10,14,26,0.2)] text-ink hover:border-ink"}`}>Request Access</Link>
              </div>
            ))}
          </div>

          {/* Lifetime banner */}
          <div className="mt-8 bg-ink text-white p-8 lg:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <span className="w-16 h-16 border border-[rgba(201,168,76,0.3)] text-gold flex items-center justify-center shrink-0"><BadgeCheck size={30} /></span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-light">Lifetime Access</h3>
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] bg-gold text-ink px-2.5 py-1">Best Value</span>
                </div>
                <p className="text-[13px] text-white/55 mt-1.5">Unlimited exchanges forever. $2,000,000 protection. Priority support. One payment, career-long membership.</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="font-display text-2xl font-bold">$3,143</div>
                <div className="text-[11px] text-white/45">one-time</div>
              </div>
              <Link href="/register" className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink bg-gold hover:bg-gold-light px-6 py-3.5 transition-colors duration-200 whitespace-nowrap">Claim Lifetime</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — deep navy ── */}
      <section className="bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.12),transparent_60%)]" />
        <div className="relative max-w-[820px] mx-auto px-6 py-28 text-center flex flex-col items-center">
          <div className="w-16 h-16 border border-[rgba(201,168,76,0.4)] flex items-center justify-center mb-8"><ShieldCheck size={32} className="text-gold" /></div>
          <SectionLabel>Begin Verification</SectionLabel>
          <h2 className="font-display text-[40px] lg:text-[48px] font-semibold leading-[1.1]">Join the Network</h2>
          <p className="mt-6 text-[17px] text-white/60 leading-[1.7] max-w-[520px] font-light">
            Begin your verification today. Turn an empty home into your most valuable asset on rotation. Stop paying $110 a day for accommodation your peers could provide for free.
          </p>
          <div className="mt-12">
            <Link href="/register" className={`${GOLD_BTN} shadow-[0_4px_28px_rgba(201,168,76,0.3)]`}>Request Access</Link>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="bg-cream py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <p className="text-[13px] text-[rgba(10,14,26,0.5)] leading-[1.9]">
            UnSwap is an independent, staff-led platform. It is not affiliated with, endorsed by, or formally connected to the United Nations, the World Bank Group, the International Monetary Fund, or any international organisation. All trademarks and organisation names are the property of their respective owners.
          </p>
        </div>
      </section>

      {/* ── Footer — deep navy ── */}
      <footer className="bg-ink text-white">
        <div className="max-w-[1160px] mx-auto px-6 pt-20 pb-12">
          <div className="grid gap-12 md:grid-cols-12 lg:gap-8 border-b border-white/10 pb-16">
            <div className="md:col-span-5 lg:col-span-4 flex flex-col">
              <Logo wordClassName="text-white" />
              <p className="mt-6 text-[14px] text-white/50 max-w-[320px] leading-[1.8] font-light">
                Enabling mobility. Empowering community. The verified home exchange network for international organisation professionals.
              </p>
            </div>
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-6">Network</h4>
                <ul className="space-y-4 text-[14px] text-white/60 font-light">
                  <li><a href="#network" className="hover:text-white transition-colors">The Network</a></li>
                  <li><a href="#homes" className="hover:text-white transition-colors">Homes</a></li>
                  <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Membership</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-6">Company</h4>
                <ul className="space-y-4 text-[14px] text-white/60 font-light">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/early-access" className="hover:text-white transition-colors">Early Access</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Request Access</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-6">Legal</h4>
                <ul className="space-y-4 text-[14px] text-white/60 font-light">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-[13px] text-white/45">© {new Date().getFullYear()} UnSwap. All rights reserved.</p>
            <div className="flex items-center gap-5 text-white/50">
              <a href="#" aria-label="X (Twitter)" className="p-2 hover:text-gold transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
              <a href="#" aria-label="Facebook" className="p-2 hover:text-gold transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.324V1.325C24 .597 23.403 0 22.675 0z"/></svg></a>
              <a href="#" aria-label="LinkedIn" className="p-2 hover:text-gold transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
