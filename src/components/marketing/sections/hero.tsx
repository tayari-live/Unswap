import { Container, Display, GhostButton, GoldButton } from "../ui";
import { HeroVideo } from "../hero-video";
import { REQUEST_ACCESS, SECTIONS } from "@/lib/links";

/*
 * Hero — full-width editorial, not a split screen.
 *
 * A split hero puts a product screenshot beside a value proposition, which is
 * the SaaS convention and says "software". One statement over one moving image,
 * left-aligned on a Navy ground, says "institution".
 *
 * The video takes a flat Navy scrim rather than a gradient: the brand forbids
 * gradients, and a flat scrim holds contrast evenly across the frame instead of
 * leaving the top-right corner to chance.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-navy">
      <HeroVideo />
      {/* Navy scrim, kept light enough that the footage stays clearly visible.
          65% is about as far down as it goes while the white body copy at 75%
          opacity still clears AA against the brighter frames of the loop. */}
      <div className="absolute inset-0 bg-navy/[0.65]" aria-hidden="true" />

      <Container className="relative py-32 lg:py-40">
        <div className="max-w-[860px]">
          <p className="max-w-[520px] text-[11px] font-medium uppercase leading-[1.9] tracking-[0.24em] text-gold">
            A private home-exchange network for international organisation
            professionals
          </p>

          <Display
            as="h1"
            ground="gold"
            /* The lower bound is set so "Exchange homes." holds one line at
               375px — above ~2.9rem it wraps and the statement becomes three
               ragged lines instead of the two it is written as. */
            className="mt-8 text-[clamp(2.75rem,8vw,6.5rem)]"
          >
            Exchange homes.
            <br />
            Not money.
          </Display>

          <p className="mt-9 max-w-[560px] text-[17px] leading-[1.75] text-white/75 lg:text-[18px]">
            Move between duty stations with a trusted network of verified UN,
            World Bank, IMF and international organisation professionals.
          </p>

          <div className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center">
            <GoldButton href={REQUEST_ACCESS}>Request access</GoldButton>
            <GhostButton href={SECTIONS.howItWorks}>How it works</GhostButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
