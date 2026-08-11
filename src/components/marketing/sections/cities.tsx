import Image from "next/image";
import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * Where the network reaches.
 *
 * These cards are typographic on purpose. Stock photography captioned with a
 * city name is a claim — that UnSwap has homes there, and that this is one of
 * them — and neither is true yet. Set as type, a city reads as what it is: a
 * duty station the network is built for. The single photograph is unlabelled
 * and claims nothing.
 *
 * No availability, counts or "homes from" pricing appear here until there are
 * real listings behind them.
 */

const PRIMARY = [
  { city: "Geneva", country: "Switzerland" },
  { city: "Nairobi", country: "Kenya" },
  { city: "Washington, DC", country: "United States" },
];

const FURTHER = [
  "Paris",
  "Vienna",
  "New York",
  "London",
  "Bangkok",
  "Addis Ababa",
];

export function Cities() {
  return (
    <section id="explore" className="scroll-mt-24 bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-[640px]">
          <Eyebrow>Duty stations</Eyebrow>
          <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
            Where will your work take you next?
          </Display>
        </Reveal>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="relative aspect-[4/3] w-full">
            <Image
              src="/images/home-geneva.jpg"
              alt="A bright residential stairwell and hallway in a member's home."
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </Reveal>

          <div>
            <Reveal
              delay={80}
              className="grid border-t border-navy/10 sm:grid-cols-3 sm:border-t-0"
            >
              {PRIMARY.map((place) => (
                <div
                  key={place.city}
                  className="border-b border-navy/10 py-8 sm:border-b-0 sm:border-t sm:pr-6"
                >
                  <div className="font-display text-[32px] font-light leading-tight text-navy lg:text-[38px]">
                    {place.city}
                  </div>
                  <div className="mt-2 text-[12px] font-medium uppercase tracking-[0.18em] text-gold-ink">
                    {place.country}
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal delay={140} className="mt-12">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-55">
                Also built for
              </p>
              <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                {FURTHER.map((city, i) => (
                  <li key={city} className="flex items-center gap-4">
                    <span className="text-[17px] text-navy">{city}</span>
                    {i < FURTHER.length - 1 && (
                      <span className="text-gold" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-10 max-w-[440px] text-[14px] leading-[1.75] text-ink-55">
                Cities shown are duty stations the network is built around.
                Homes are visible to verified members inside the network.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
