import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * FAQ.
 *
 * Built on <details>/<summary> rather than a scripted accordion. The native
 * element is already keyboard-operable, already announced as expandable, and
 * already searchable by the browser's find-in-page when closed in Chrome — all
 * of which a hand-rolled version has to re-implement and usually half-does.
 *
 * Answers are short by design. A long answer here is a sign the page above it
 * failed to explain something.
 */

const QUESTIONS = [
  {
    q: "Who can join UnSwap?",
    a: "Professionals employed by international organisations, verified through their institutional affiliation. Access is by request, and every member is checked before they can browse, list or message.",
  },
  {
    q: "Do I need to work for the UN?",
    a: "No. The UN system is well represented, but eligibility extends across international organisations, including development banks, financial institutions, agencies and comparable bodies.",
  },
  {
    q: "How does verification work?",
    a: "Members are verified against eligible organisation domains, or through manual review where an institutional email alone is not enough to confirm affiliation.",
  },
  {
    q: "Do members pay each other?",
    a: "No. Homes are exchanged rather than rented, so no nightly rate passes between members. You pay an annual membership to UnSwap, and nothing to the person whose home you stay in.",
  },
  {
    q: "What are credits?",
    a: "One credit equals one night. You earn credits by hosting and spend them when you stay, which means two members never have to want each other's homes at the same time.",
  },
  {
    q: "How does property protection work?",
    a: "Exchanges are covered by a property damage guarantee up to the stated coverage for your membership, alongside the exchange agreement generated for every accepted exchange.",
  },
  {
    q: "Can I exchange internationally?",
    a: "Yes. The network is built around duty stations worldwide, and most exchanges are between members in different countries.",
  },
  {
    q: "What happens if my exchange request is declined?",
    a: "Nothing is charged and no credits move. Members decline for reasons of timing far more often than anything else, and you are free to request another home straight away.",
  },
  {
    q: "How does membership work?",
    a: "Membership is annual, and the tier you choose sets how many exchanges you can make in that year. Lifetime membership is a single payment for unlimited access.",
  },
  {
    q: "What happens when my membership ends?",
    a: "Your listing stops being visible to the network and you cannot start new exchanges. Credits you have already earned are held against your account, and renewing restores access to them.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-white">
      <Container className="py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <Display className="mt-6 text-[clamp(2rem,3.6vw,2.75rem)]">
              Before you request access
            </Display>
          </Reveal>

          <Reveal delay={100} className="border-t border-navy/12">
            {QUESTIONS.map((item) => (
              <details
                key={item.q}
                className="group border-b border-navy/12 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-8 py-5 text-[16px] font-medium text-navy transition-colors duration-200 hover:text-gold-ink">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-gold transition-transform duration-300 group-open:rotate-45"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-[620px] pb-6 pr-10 text-[15px] leading-[1.8] text-ink-70">
                  {item.a}
                </p>
              </details>
            ))}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
