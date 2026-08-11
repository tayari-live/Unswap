import { Container, Display, Eyebrow, Heading } from "../ui";
import { Reveal } from "../reveal";

/*
 * The core idea.
 *
 * The heading is the whole argument, so it gets the largest Cormorant setting
 * on the page after the hero and nothing else competes with it — no image, no
 * icon, three cards underneath and that is all.
 */

const PILLARS = [
  {
    title: "Verified",
    body: "Institutional identity verification.",
  },
  {
    title: "Private",
    body: "A network built for international organisation professionals.",
  },
  {
    title: "Reciprocal",
    body: "Exchange homes rather than paying each other for accommodation.",
  },
];

export function Network() {
  return (
    <section data-ground="navy" className="bg-navy">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-[760px]">
          <Eyebrow ground="navy">The core idea</Eyebrow>
          <Display
            ground="navy"
            className="mt-6 text-[clamp(2.75rem,5.5vw,4.5rem)]"
          >
            The network is the product.
          </Display>
          <p className="mt-8 max-w-[620px] text-[17px] leading-[1.8] text-white/70">
            UnSwap is intentionally closed. Every member is verified through
            their international organisation, creating a community where trust
            travels with you.
          </p>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-12 grid gap-px border border-white/15 bg-white/15 md:grid-cols-3"
        >
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="bg-navy p-9 lg:p-11">
              <div className="h-px w-10 bg-gold" aria-hidden="true" />
              <Heading className="mt-8 text-[13px] uppercase tracking-[0.18em] text-gold">
                {pillar.title}
              </Heading>
              <p className="mt-4 text-[16px] leading-[1.75] text-white/70">
                {pillar.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
