import { Container, Display, GoldButton } from "../ui";
import { Reveal } from "../reveal";
import { REQUEST_ACCESS } from "@/lib/links";

/*
 * The close.
 *
 * The id is load-bearing: the mobile sticky action watches for this section and
 * retires when it comes into view, so the two calls to action never stack.
 *
 * The reassurance line states that membership is paid. Burying that until
 * after verification would win a few more requests and lose the trust the rest
 * of the page spent twelve sections building.
 */
export function FinalCta() {
  return (
    <section id="final-cta" data-ground="navy" className="bg-navy">
      <Container className="py-20 lg:py-24">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <Display ground="navy" className="text-[clamp(2.25rem,4.6vw,3.75rem)]">
            Your next home may already be part of the network.
          </Display>
          <p className="mx-auto mt-8 max-w-[540px] text-[17px] leading-[1.8] text-white/70">
            Request access to UnSwap and join a private home-exchange network
            built for the international organisation community.
          </p>
          <div className="mt-11 flex justify-center">
            <GoldButton href={REQUEST_ACCESS}>Request access</GoldButton>
          </div>
          <p className="mt-8 text-[12px] tracking-[0.06em] text-white/50">
            Verification required · Membership access is paid
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
