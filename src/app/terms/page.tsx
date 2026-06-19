import { LegalShell, LegalSection } from "@/components/site/legal-shell"

export const metadata = {
  title: "Terms of Service",
  description: "The terms governing membership and use of the UnSwap home exchange network.",
}

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="19 June 2026">
      <p>These Terms of Service (&quot;Terms&quot;) govern your access to and use of UnSwap. By creating an account or joining the waitlist, you agree to these Terms.</p>

      <LegalSection heading="1. Eligibility">
        <p>Membership is restricted to verified, active professionals of the United Nations, World Bank Group, IMF, and affiliated international organisations. You must provide accurate information and valid verification documents. We may decline, suspend, or revoke membership where eligibility cannot be confirmed.</p>
      </LegalSection>

      <LegalSection heading="2. Membership &amp; subscriptions">
        <p>Full access requires an active paid subscription. Annual plans renew automatically until cancelled; upgrades take effect immediately and downgrades at the next renewal. Lifetime Access is a one-time purchase and is non-recurring. Payments are processed by Stripe.</p>
      </LegalSection>

      <LegalSection heading="3. Exchanges &amp; the exchange agreement">
        <p>When an exchange is confirmed, both parties enter a Swap Agreement covering dates, the property, and guarantee terms. Members agree to honour confirmed dates, treat each other&apos;s homes with care, and leave properties in the condition received. Exchanges involve no monetary rent between members.</p>
      </LegalSection>

      <LegalSection heading="4. Property guarantee">
        <p>Each membership tier carries a property protection amount, applied in accordance with the guarantee terms in force at the time of the exchange. The guarantee is subject to eligibility conditions, reasonable evidence, and good-faith conduct by both parties.</p>
      </LegalSection>

      <LegalSection heading="5. Member conduct">
        <p>You agree not to misrepresent your identity, listing, or eligibility; not to harass other members; and to use messaging and reviews in good faith. We may remove content and suspend accounts that breach these Terms.</p>
      </LegalSection>

      <LegalSection heading="6. Cancellation &amp; refunds">
        <p>You may cancel a subscription at any time; access continues until the end of the current period. Statutory withdrawal rights, where applicable, are preserved. Lifetime Access is non-refundable except where required by law.</p>
      </LegalSection>

      <LegalSection heading="7. Limitation of liability">
        <p>UnSwap provides a platform connecting verified members. To the maximum extent permitted by law, UnSwap is not liable for the conduct of members or the condition of properties beyond the express guarantee terms. The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.</p>
      </LegalSection>

      <LegalSection heading="8. Independence">
        <p>UnSwap is an independent, staff-led platform and is not affiliated with, endorsed by, or sponsored by the United Nations or any other organisation referenced on the platform.</p>
      </LegalSection>

      <LegalSection heading="9. Changes &amp; contact">
        <p>We may update these Terms; material changes will be notified. Questions can be sent to <a href="mailto:legal@unswap.net" className="text-[var(--gold-dark)] underline">legal@unswap.net</a>.</p>
      </LegalSection>

      <p className="text-sm text-neutral">This document is provided for transparency and should be reviewed by legal counsel before launch.</p>
    </LegalShell>
  )
}
