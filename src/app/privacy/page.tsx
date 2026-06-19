import { LegalShell, LegalSection } from "@/components/site/legal-shell"

export const metadata = {
  title: "Privacy Policy",
  description: "How UnSwap collects, uses, and protects your personal data, in line with the GDPR.",
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="19 June 2026">
      <p>
        This Privacy Policy explains how UnSwap (&quot;we&quot;, &quot;us&quot;) collects, uses, shares, and protects personal data when you use our platform. We are committed to compliance with the EU General Data Protection Regulation (GDPR) and equivalent data-protection laws.
      </p>

      <LegalSection heading="1. Data we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account &amp; verification data:</strong> name, work email, institutional affiliation, staff ID and proof of employment you upload for verification.</li>
          <li><strong>Profile data:</strong> nationality, duty station, languages, bio, photo, and links you choose to add.</li>
          <li><strong>Listing &amp; exchange data:</strong> property details, swap requests, messages, and reviews.</li>
          <li><strong>Billing data:</strong> subscription tier and payment status. Card details are handled by our payment processor (Stripe) and never stored by us.</li>
          <li><strong>Technical data:</strong> log and device information needed to operate and secure the service.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Lawful basis for processing">
        <p>We process personal data on the following bases: <strong>performance of a contract</strong> (to provide the exchange service), <strong>consent</strong> (for optional communications), <strong>legitimate interests</strong> (to secure and improve the platform and verify professional status), and <strong>legal obligation</strong> where applicable.</p>
      </LegalSection>

      <LegalSection heading="3. How we use your data">
        <p>To verify eligibility, operate listings and exchanges, facilitate messaging, process subscriptions, prevent fraud and abuse, and send transactional and (with consent) marketing communications. Verification documents are reviewed only by authorised verification officers and are never shown to other members.</p>
      </LegalSection>

      <LegalSection heading="4. Data minimisation &amp; retention">
        <p>We collect only what is necessary for the purposes above and retain personal data only as long as needed to provide the service or to meet legal obligations. Verification documents are retained for the minimum period required to maintain the integrity of the network.</p>
      </LegalSection>

      <LegalSection heading="5. Sharing &amp; cross-border transfers">
        <p>We share data with processors who help us operate (e.g. hosting, email delivery, payments) under appropriate contractual safeguards. Where data is transferred outside the EEA, we rely on adequacy decisions or Standard Contractual Clauses. We do not sell personal data.</p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>Subject to applicable law, you have the right to access, rectify, erase, restrict, and port your data, and to object to certain processing. You may withdraw consent at any time. To exercise these rights, contact us at <a href="mailto:privacy@unswap.net" className="text-[var(--gold-dark)] underline">privacy@unswap.net</a>. You also have the right to lodge a complaint with your local supervisory authority.</p>
      </LegalSection>

      <LegalSection heading="7. Security">
        <p>We apply technical and organisational measures appropriate to the sensitivity of the data, including encrypted transport, access controls, and the verified, closed-network model that underpins UnSwap.</p>
      </LegalSection>

      <LegalSection heading="8. Cookies">
        <p>We use essential cookies to keep you signed in and to operate the service. Non-essential cookies are used only with your consent, which you can manage via the cookie banner.</p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>Questions about this policy or your data can be sent to <a href="mailto:privacy@unswap.net" className="text-[var(--gold-dark)] underline">privacy@unswap.net</a>.</p>
      </LegalSection>

      <p className="text-sm text-neutral">UnSwap is an independent, staff-led platform, not affiliated with the United Nations. This document is provided for transparency and should be reviewed by legal counsel before launch.</p>
    </LegalShell>
  )
}
