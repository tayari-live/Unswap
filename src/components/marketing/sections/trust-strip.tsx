import { Container, Eyebrow } from "../ui";

/*
 * Trust strip.
 *
 * Deliberately thin — one band of type between the hero and the argument. It
 * answers "is this for me?" in the two seconds before a visitor decides to
 * keep scrolling.
 *
 * These are organisation *names*, set as plain text rather than logos: UnSwap
 * is staff-led and independent, and reproducing institutional marks would
 * imply an endorsement that does not exist. The footer carries the explicit
 * non-affiliation notice.
 */

const ORGANISATIONS = [
  "UN",
  "UNDP",
  "WHO",
  "IMF",
  "World Bank",
  "UNICEF",
  "UNHCR",
  "ILO",
  "WFP",
];

export function TrustStrip() {
  return (
    <section className="border-b border-navy/10 bg-white">
      <Container className="py-12 lg:py-14">
        <div className="flex flex-col items-center gap-6 text-center">
          <Eyebrow>Built for the international organisation community</Eyebrow>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {ORGANISATIONS.map((org, i) => (
              <li key={org} className="flex items-center gap-5">
                <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-70">
                  {org}
                </span>
                {i < ORGANISATIONS.length - 1 && (
                  <span className="text-gold" aria-hidden="true">
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>

          <p className="font-display text-[22px] font-light leading-snug text-navy lg:text-[26px]">
            Verified professionals. Trusted homes. No strangers.
          </p>
        </div>
      </Container>
    </section>
  );
}
