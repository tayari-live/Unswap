import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * Social proof — without inventing any.
 *
 * There are no member testimonials yet, and a manufactured quote from a
 * plausible-sounding "P&O Officer, UNDP Geneva" is exactly the thing this
 * audience is trained to spot. So the section runs the fallback the brand
 * anticipated: one statement of intent, and figures that describe the
 * community rather than pretending to describe traction.
 *
 * When real quotes exist, this becomes a large Cormorant quote with a name and
 * duty station beneath it, and the figures move or go.
 */

const FIGURES = [
  {
    value: "100,000+",
    label: "Eligible professionals across international organisations worldwide",
  },
  {
    value: "50+",
    label: "Duty station cities the network is built around",
  },
  {
    value: "100%",
    label: "Members verified before they can browse, list or message",
  },
];

export function Proof() {
  return (
    <section className="bg-parchment-dark">
      <Container className="py-20 lg:py-24">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <Eyebrow>The community</Eyebrow>
          <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
            Built for a community that moves around the world.
          </Display>
        </Reveal>

        <Reveal delay={100} className="mt-14 grid gap-12 sm:grid-cols-3">
          {FIGURES.map((figure) => (
            <div key={figure.value} className="text-center">
              <div className="font-display text-[clamp(2.75rem,4.5vw,3.75rem)] font-light leading-none text-navy">
                {figure.value}
              </div>
              <div
                className="mx-auto mt-6 h-px w-10 bg-gold"
                aria-hidden="true"
              />
              <p className="mx-auto mt-6 max-w-[260px] text-[14px] leading-[1.7] text-ink-70">
                {figure.label}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
