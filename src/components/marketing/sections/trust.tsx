import Image from "next/image";
import { Container, Display, Eyebrow, Heading } from "../ui";
import { Reveal } from "../reveal";

/*
 * Trust and safety.
 *
 * Reassuring rather than fear-based: each item describes what the platform
 * does, and none of them describes what could go wrong. No figures are quoted
 * for the property guarantee here — coverage varies by membership, and a
 * number on a landing page becomes a promise the terms have to honour.
 */

const MEASURES = [
  {
    title: "Institutional verification",
    body: "Members are verified against eligible organisation domains or through manual review.",
  },
  {
    title: "Property protection",
    body: "Property damage guarantee up to the stated coverage.",
  },
  {
    title: "Exchange agreement",
    body: "An agreement is generated when an exchange is accepted.",
  },
  {
    title: "Member reputation",
    body: "Post-exchange reviews contribute to trust.",
  },
];

export function Trust() {
  return (
    <section id="trust" data-ground="navy" className="scroll-mt-24 bg-navy">
      <Container className="py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
          <div>
            <Reveal>
              <Eyebrow ground="navy">Trust &amp; safety</Eyebrow>
              <Display
                ground="navy"
                className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]"
              >
                Trust is built into every exchange.
              </Display>
            </Reveal>

            <dl className="mt-12 grid gap-x-12 gap-y-11 sm:grid-cols-2">
              {MEASURES.map((measure, i) => (
                <Reveal key={measure.title} delay={i * 60}>
                  <div className="h-px w-10 bg-gold" aria-hidden="true" />
                  <dt className="mt-7">
                    <Heading as="h3" className="text-[17px] text-white">
                      {measure.title}
                    </Heading>
                  </dt>
                  <dd className="mt-3 text-[15px] leading-[1.75] text-white/65">
                    {measure.body}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>

          <Reveal delay={120} className="relative min-h-[380px] lg:min-h-full">
            <Image
              src="/images/auth-institution.jpg"
              alt="Institutional office towers seen from street level."
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            {/* The photograph is cool and pale; a light Navy scrim settles it
                into the section rather than letting it glare. */}
            <div className="absolute inset-0 bg-navy/40" aria-hidden="true" />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
