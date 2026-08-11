import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * Credits.
 *
 * The differentiator, and the one mechanic a visitor has to actually
 * understand — so it gets a diagram rather than another paragraph. The chain
 * is drawn with type and rules alone: an illustration here would decorate a
 * concept that is already sequential.
 */

const CHAIN = [
  { label: "You", detail: "Host in Nairobi" },
  { label: "Earn credits", detail: "One credit for each night hosted" },
  { label: "Travel to Geneva", detail: "Your next duty station" },
  { label: "Stay with another member", detail: "No nightly rate paid" },
];

export function Credits() {
  return (
    <section className="bg-parchment">
      <Container className="py-20 lg:py-28">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow>Credits</Eyebrow>
            <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
              Stay now. Host later.
            </Display>
            <p className="mt-8 max-w-[520px] text-[16px] leading-[1.8] text-ink-70">
              Credits remove the need for two members to want each other&rsquo;s
              homes at exactly the same time.
            </p>

            <div className="mt-12 border-t border-navy/10 pt-8">
              <div className="font-display text-[clamp(3rem,6vw,4.75rem)] font-light leading-none text-navy">
                1 credit <span className="text-gold">=</span> 1 night
              </div>
            </div>
          </Reveal>

          {/*
            The chain. Presented as an ordered list so the sequence survives
            without the connecting rules, which are decoration and hidden from
            assistive technology.
          */}
          <Reveal delay={100}>
            <ol className="border border-navy/10 bg-white">
              {CHAIN.map((link, i) => (
                <li
                  key={link.label}
                  className={`relative px-8 py-8 lg:px-10 ${
                    i > 0 ? "border-t border-navy/10" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-5">
                    <span
                      className="text-[11px] font-medium tracking-[0.2em] text-gold-ink"
                      aria-hidden="true"
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <div className="font-display text-[26px] font-light leading-tight text-navy">
                        {link.label}
                      </div>
                      <p className="mt-1.5 text-[14px] text-ink-55">
                        {link.detail}
                      </p>
                    </div>
                  </div>

                  {i < CHAIN.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-3 left-10 z-10 flex h-6 w-6 items-center justify-center bg-white text-gold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 4v15m0 0 6-6m-6 6-6-6"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
