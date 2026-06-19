import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { OnboardingWizard } from "./onboarding-wizard"

export const dynamic = "force-dynamic"
export const metadata = { title: "Welcome to UnSwap" }

export default async function OnboardingPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")
  if (user.role === "admin") redirect("/overview")
  if (user.onboardedAt) redirect("/dashboard")

  const initialProfile = {
    fullName: user.fullName ?? "",
    imageUrl: user.imageUrl ?? null,
    nationality: user.nationality ?? "",
    dutyStation: user.dutyStation ?? "",
    organisation: user.organisation ?? "",
    languages: user.languages ?? "",
    bio: user.bio ?? "",
    linkedinUrl: user.linkedinUrl ?? "",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <OnboardingWizard
        firstName={user.firstName}
        initialProfile={initialProfile}
        initialCompletion={user.profileCompletion}
      />
    </div>
  )
}
