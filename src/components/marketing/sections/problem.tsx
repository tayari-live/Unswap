import Image from "next/image";
import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * The problem, stated once.
 *
 * Three figures, not a dashboard of them. Each is labelled as typical or
 * potential rather than promised, because none of them is a quote UnSwap can
 * make on a member's behalf — and a marketing page that overstates a number
 * here is the fastest way to lose an audience that reads budgets for a living.
 */

const FIGURES = [
  {
    value: "$40K–$80K",
    label: "Typical annual accommodation costs associated with international moves.",
  },
  {
    value: "$110/day",
    label: "Typical accommodation spend.",
  },
  {
    value: "$350/night",
    label: "Potential short-let pricing in some cities.",
  },
];

export function Problem() {
  return (
    <section className="bg-parchment">
      <Container className="py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow>The inefficiency</Eyebrow>
            <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
              Your home may be empty while someone else is paying to stay in
              your city.
            </Display>
            <p className="mt-8 text-[16px] leading-[1.8] text-ink-70">
              Rotation moves people, not property. A posting begins and a home
              sits closed for months — while a colleague arriving in the same
              city signs a short let at commercial rates, and another does the
              same in the city you have just left. Everybody pays a market that
              exists only because two homes are empty at the wrong times, and
              the money leaves the community entirely.
            </p>
          </Reveal>

          <Reveal delay={100} className="relative aspect-[3/2] w-full">
            <Image
              src="/images/home-newyork.jpg"
              alt="An unoccupied apartment living room, curtains open and furniture in place."
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>

        <Reveal className="mt-14 grid gap-px border border-navy/10 bg-navy/10 sm:grid-cols-3">
          {FIGURES.map((figure) => (
            <div key={figure.value} className="bg-parchment p-9 lg:p-10">
              <div className="font-display text-[clamp(2.5rem,4vw,3.25rem)] font-light leading-none text-navy">
                {figure.value}
              </div>
              <div className="mt-6 h-px w-10 bg-gold" aria-hidden="true" />
              <p className="mt-6 text-[14px] leading-[1.7] text-ink-70">
                {figure.label}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
