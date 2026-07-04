import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldCheck, Clock, MailWarning } from "lucide-react"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { reviewTypeForEmail } from "@/server/services/registration"
import { PageHeader } from "@/components/ui/page-header"
import { VerifyIdentityForm } from "./verify-identity-form"

export const dynamic = "force-dynamic"

export default async function VerifyIdentityPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const status = user.verificationStatus

  // Terminal / waiting states get an explainer card instead of the form.
  if (status === "FULLY_VERIFIED") {
    return (
      <Shell>
        <StateCard
          icon={<ShieldCheck size={26} />}
          tone="teal"
          title="You're fully verified"
          body="Your professional status is confirmed. You have full access to browse, list, and exchange."
          cta={{ href: "/dashboard", label: "Go to dashboard" }}
        />
      </Shell>
    )
  }

  if (status === "PENDING_ID_REVIEW") {
    return (
      <Shell>
        <StateCard
          icon={<Clock size={26} />}
          tone="gold"
          title="Documents under review"
          body="Thank you. Our verification officers are reviewing your submission — usually within 2 business days — and will email you once a decision is made."
          cta={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      </Shell>
    )
  }

  if (status === "PENDING_EMAIL") {
    return (
      <Shell>
        <StateCard
          icon={<MailWarning size={26} />}
          tone="gold"
          title="Confirm your email first"
          body="Please confirm your institutional email using the link we sent before uploading your documents."
          cta={{ href: "/dashboard", label: "Back to dashboard" }}
        />
      </Shell>
    )
  }

  // EMAIL_VERIFIED or REJECTED → show the upload form.
  const type = await reviewTypeForEmail(user.email)

  // On rejection, show the reviewer's note so the member knows what to fix.
  const lastRejection =
    status === "REJECTED"
      ? await prisma.verificationSubmission.findFirst({
          where: { memberId: userId, status: "REJECTED" },
          orderBy: { reviewedAt: "desc" },
          select: { reviewNote: true },
        })
      : null

  return (
    <Shell>
      {status === "REJECTED" && (
        <div className="bg-[var(--crimson)]/10 border-l-4 border-[var(--crimson)] p-3.5 rounded-lg mb-6">
          <p className="text-sm text-[var(--crimson)] font-medium">
            Your previous submission was not approved.
          </p>
          {lastRejection?.reviewNote && (
            <p className="mt-1.5 text-sm text-[var(--navy)]">
              <span className="font-semibold">Reviewer&apos;s note:</span> {lastRejection.reviewNote}
            </p>
          )}
          <p className="mt-1.5 text-sm text-neutral-dark">
            You can resubmit with updated documents below.
          </p>
        </div>
      )}
      <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-6 sm:p-8">
        <p className="text-sm text-neutral mb-6">
          {type === "fast_track"
            ? "Your institutional email qualifies for fast-track review — upload your staff ID to complete verification."
            : "Upload your staff ID and proof of employment so our team can verify your professional status."}
        </p>
        <VerifyIdentityForm type={type} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto pb-12">
      <PageHeader
        title="Verify your identity"
        subtitle="Complete verification to unlock the full UnSwap network."
      />
      {children}
    </div>
  )
}

function StateCard({
  icon,
  tone,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode
  tone: "teal" | "gold"
  title: string
  body: string
  cta: { href: string; label: string }
}) {
  const toneClass =
    tone === "teal"
      ? "bg-[var(--teal-light)] text-[var(--teal)]"
      : "bg-[var(--parchment)] text-[var(--gold-dark)]"
  return (
    <div className="bg-surface rounded-2xl border border-[var(--border)] shadow-sm p-8 text-center">
      <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${toneClass}`}>
        {icon}
      </div>
      <h2 className="font-display text-2xl font-bold text-[var(--navy)]">{title}</h2>
      <p className="mt-3 text-neutral leading-relaxed">{body}</p>
      <Link
        href={cta.href}
        className="mt-8 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--navy)] hover:bg-[var(--navy-light)] transition-colors"
      >
        {cta.label}
      </Link>
    </div>
  )
}
