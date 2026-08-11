import { Container, Display, Eyebrow } from "../ui";
import { Reveal } from "../reveal";

/*
 * Positioning, not attack.
 *
 * The competitor column is unnamed and set in the same weight as everything
 * else on the page; only the UnSwap column takes gold. A landing page that
 * sneers reads as insecure, and this audience is not persuaded by it.
 *
 * A real table, because this is genuinely tabular: two named columns compared
 * across five rows. On narrow screens it scrolls inside its own container
 * rather than forcing the page to.
 */

const ROWS = [
  ["Open marketplace", "Closed network"],
  ["Strangers", "Verified professionals"],
  ["Pay nightly rates", "Exchange credits"],
  ["Reviews after the fact", "Institutional identity + trust"],
  ["Transaction focused", "Community focused"],
];

export function Comparison() {
  return (
    <section className="bg-white">
      <Container className="py-20 lg:py-28">
        <Reveal className="max-w-[640px]">
          <Eyebrow>Positioning</Eyebrow>
          <Display className="mt-6 text-[clamp(2.25rem,4.4vw,3.5rem)]">
            Not another short-let marketplace.
          </Display>
        </Reveal>

        <Reveal delay={100} className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">
              Traditional short lets compared with UnSwap
            </caption>
            <thead>
              <tr className="border-b border-navy/15">
                <th
                  scope="col"
                  className="w-1/2 py-5 pr-8 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-55"
                >
                  Traditional short let
                </th>
                <th
                  scope="col"
                  className="w-1/2 border-l border-navy/10 py-5 pl-8 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-ink"
                >
                  UnSwap
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([theirs, ours]) => (
                <tr key={ours} className="border-b border-navy/10">
                  <td className="py-5 pr-8 text-[16px] text-ink-55">{theirs}</td>
                  <td className="border-l border-navy/10 py-5 pl-8 text-[16px] font-medium text-navy">
                    {ours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </Container>
    </section>
  );
}
