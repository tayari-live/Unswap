import { Nav } from "@/components/marketing/nav";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/sections/hero";
import { TrustStrip } from "@/components/marketing/sections/trust-strip";
import { Problem } from "@/components/marketing/sections/problem";
import { Network } from "@/components/marketing/sections/network";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { Credits } from "@/components/marketing/sections/credits";
import { Comparison } from "@/components/marketing/sections/comparison";
import { Trust } from "@/components/marketing/sections/trust";
import { Cities } from "@/components/marketing/sections/cities";
import { Proof } from "@/components/marketing/sections/proof";
import { Membership } from "@/components/marketing/sections/membership";
import { Faq } from "@/components/marketing/sections/faq";
import { FinalCta } from "@/components/marketing/sections/final-cta";

export const metadata = {
  title: "UnSwap | Exchange Homes. Not Money.",
  description:
    "A private home-exchange network for international organisation professionals. Move between duty stations with a trusted network of verified UN, World Bank, IMF and international organisation members.",
};

/*
 * The marketing landing page.
 *
 * The order below is the argument, and it is the reason this page is not
 * hero → features → features → pricing:
 *
 *   Who is this for?         Hero, trust strip
 *   What is the problem?     Problem
 *   Why is UnSwap different? Network, credits, comparison
 *   How does it work?        How it works
 *   Can I trust it?          Trust & safety, community
 *   Where can I use it?      Cities
 *   How much does it cost?   Membership
 *   Request access           FAQ, final call to action
 *
 * Grounds alternate Navy / Parchment / White so no two adjacent sections share
 * a background, which is most of what keeps a page this long readable.
 *
 * The .marketing wrapper pins the brand colours against the product's dark
 * theme — see the note in globals.css.
 */
export default function LandingPage() {
  return (
    <div className="marketing font-sans">
      <a href="#main" className="sr-only skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Problem />
        <Network />
        <HowItWorks />
        <Credits />
        <Comparison />
        <Trust />
        <Proof />
        <Cities />
        <Membership />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
