import { Container, Display, Eyebrow, Heading } from "../ui";
import { Reveal } from "../reveal";

/*
 * How it works.
 *
 * The clearest section on the page, so it carries the least decoration: a gold
 * numeral, a heading, a line of explanation. Five steps read as a sequence
 * rather than as five features, which is the point — a visitor should finish
 * this able to describe the product to a colleague.
 */

const STEPS = [
  {
    n: "01",
    title: "Request access",
    body: "Tell us who you are and where you work.",
  },
  {
    n: "02",
    title: "Get verified",
    body: "Verify your identity and institutional affiliation.",
  },
  {
    n: "03",
    title: "List your home",
    body: "Tell the network where and when your home is available.",
  },
  {
    n: "04",
    title: "Explore",
    body: "Find verified homes at your next duty station.",
  },
  {
    n: "05",
    title: "Exchange",
    body: "Use credits to stay without paying nightly accommodation rates.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-[640px]">
          <Eyebrow>The process</Eyebrow>
          <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
            How UnSwap works
          </Display>
        </Reveal>

        <ol className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal
              as="li"
              key={step.n}
              delay={i * 60}
              className="border-t border-navy/10 pt-8"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-[13px] font-bold tracking-[0.04em] text-navy">
                {step.n}
              </span>
              <Heading className="mt-7 text-[19px] text-navy">
                {step.title}
              </Heading>
              <p className="mt-3 max-w-[300px] text-[15px] leading-[1.75] text-ink-70">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
