import { ShieldCheck, Users, ArrowLeftRight } from "lucide-react"
import { LegalShell, LegalSection } from "@/components/site/legal-shell"

export const metadata = {
  title: "About",
  description: "Why UnSwap exists: a verified home exchange network for UN and international organisation professionals.",
}

export default function AboutPage() {
  return (
    <LegalShell title="About UnSwap">
      <p className="text-lg text-[var(--navy)]">
        UnSwap is a closed-loop, institutionally verified home exchange network built exclusively for UN staff, World Bank Group, IMF, and affiliated international organisation professionals.
      </p>

      <LegalSection heading="The problem we solve">
        <p>
          UN and IO professionals face mandatory geographic rotations every two to three years. Commercial accommodation in duty-station cities — New York, Geneva, Vienna, Nairobi, Rome, Paris — is prohibitively expensive for short and medium-term stays, while a professional&apos;s own home sits empty and unprotected.
        </p>
        <p>
          UnSwap turns that empty home into a living asset. Members exchange homes — simultaneously, or non-simultaneously using UnSwap Credits — eliminating accommodation costs at both ends of a posting.
        </p>
      </LegalSection>

      <LegalSection heading="Built on trust">
        <div className="grid sm:grid-cols-3 gap-4 not-prose">
          {[
            { icon: ShieldCheck, t: "Verified", b: "Every member is confirmed as an active UN/IO professional before they can browse, list, or message." },
            { icon: Users, t: "Peer network", b: "The person staying in your home is a vetted peer with as much to protect as you do." },
            { icon: ArrowLeftRight, t: "Protected", b: "A legal exchange agreement and property guarantee back every swap." },
          ].map((c) => (
            <div key={c.t} className="bg-surface rounded-2xl border border-[var(--border)] p-5">
              <c.icon size={22} className="text-[var(--gold-dark)]" />
              <h3 className="mt-3 font-display font-bold text-[var(--navy)]">{c.t}</h3>
              <p className="mt-1 text-sm text-neutral">{c.b}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection heading="Our commitment to your data">
        <p>
          We hold our members&apos; data to the standards the community expects. UnSwap is built to be GDPR-compliant: we practise data minimisation, process personal data on a lawful basis, and honour subject-access and erasure rights. Read our <a href="/privacy" className="text-[var(--gold-dark)] underline">Privacy Policy</a> for detail.
        </p>
      </LegalSection>

      <LegalSection heading="A note on independence">
        <p>
          UnSwap is an independent, staff-led platform. It is <strong>not affiliated with, endorsed by, or sponsored by</strong> the United Nations or any of its agencies, the World Bank Group, or the IMF. Organisation names are used only to describe the professional community UnSwap serves.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
