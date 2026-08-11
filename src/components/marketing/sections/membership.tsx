import Link from "next/link";
import { Container, Display, Eyebrow, Heading } from "../ui";
import { Reveal } from "../reveal";
import { REQUEST_ACCESS } from "@/lib/links";

/*
 * Membership.
 *
 * Not a SaaS pricing table: no feature matrix, no ticks, no "everything in the
 * previous tier, plus". Every card answers the same three questions in the
 * same order — what you get, what it costs, who it is for — so the comparison
 * happens by reading across rather than by decoding a grid.
 *
 * Unlimited Pro is the recommended plan and takes the only gold border on the
 * page. Lifetime sits apart, below, as a single band: it is a different kind of
 * decision and should not be weighed against an annual figure.
 */

const PLANS = [
  {
    name: "Limited",
    price: "$129",
    period: "/year",
    gets: "1 exchange",
    who: "For a first exchange, or a single move.",
  },
  {
    name: "Standard",
    price: "$219",
    period: "/year",
    gets: "2 exchanges",
    who: "For members who travel home and to one posting each year.",
  },
  {
    name: "Professional",
    price: "$349",
    period: "/year",
    gets: "4 exchanges",
    who: "For members moving between duty stations several times a year.",
  },
  {
    name: "Unlimited Pro",
    price: "$449",
    period: "/year",
    gets: "Unlimited exchanges",
    who: "For members permanently on rotation.",
    recommended: true,
  },
];

export function Membership() {
  return (
    <section id="membership" className="scroll-mt-24 bg-parchment">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-[640px]">
          <Eyebrow>Membership</Eyebrow>
          <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
            Choose how often you want to exchange.
          </Display>
        </Reveal>

        {/*
          Horizontal scroll on mobile, four columns from lg. The negative margin
          lets the row bleed to the screen edge so a partially visible fourth
          card signals that it scrolls.
        */}
        <Reveal
          delay={100}
          className="-mx-6 mt-12 overflow-x-auto px-6 pb-4 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          <div className="grid auto-cols-[minmax(268px,1fr)] grid-flow-col gap-5 lg:grid-flow-row lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col bg-white p-7 lg:p-8 ${
                  plan.recommended
                    ? "border-2 border-gold"
                    : "border border-navy/12"
                }`}
              >
                <div className="flex min-h-[24px] items-start justify-between gap-3">
                  <Heading className="text-[13px] uppercase tracking-[0.18em] text-navy">
                    {plan.name}
                  </Heading>
                  {plan.recommended && (
                    <span className="bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-navy">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-7 font-display text-[16px] font-light text-navy">
                  <span className="text-[44px] leading-none">{plan.price}</span>
                  <span className="ml-1 text-[15px] text-ink-55">
                    {plan.period}
                  </span>
                </div>

                <div className="mt-7 border-t border-navy/10 pt-6">
                  <p className="text-[16px] font-semibold text-navy">
                    {plan.gets}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.7] text-ink-70">
                    {plan.who}
                  </p>
                </div>

                <Link
                  href={REQUEST_ACCESS}
                  className={`mt-8 block px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
                    plan.recommended
                      ? "bg-gold text-navy hover:bg-gold-hover"
                      : "border border-navy/25 text-navy hover:border-navy"
                  }`}
                >
                  Request access
                </Link>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Lifetime. Distinctive, but one band rather than a fifth column. */}
        <Reveal
          delay={140}
          data-ground="navy"
          className="mt-6 flex flex-col justify-between gap-8 bg-navy p-9 lg:flex-row lg:items-center lg:p-11"
        >
          <div>
            <Heading className="text-[13px] uppercase tracking-[0.18em] text-gold">
              Lifetime
            </Heading>
            <p className="mt-4 font-display text-[38px] font-light leading-none text-white">
              $3,143
            </p>
            <p className="mt-4 max-w-[420px] text-[15px] leading-[1.7] text-white/65">
              Unlimited access. One payment, for members who expect to keep
              moving for the rest of a career.
            </p>
          </div>
          <Link
            href={REQUEST_ACCESS}
            className="inline-flex shrink-0 items-center justify-center border border-gold px-8 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold transition-colors duration-200 hover:bg-gold hover:text-navy"
          >
            Request access
          </Link>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-8 text-[13px] leading-[1.7] text-ink-55">
            Access is granted after verification. Membership is paid once your
            place in the network is confirmed.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
