import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { LuxPageHeader } from "@/components/ui/lux"
import { ProfileWizard } from "@/components/profile/profile-wizard"

export const dynamic = "force-dynamic"

export default async function EditProfilePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const initial = {
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
    <div className="max-w-2xl mx-auto pb-12">
      <LuxPageHeader eyebrow="Your Profile" title="Edit Profile" subtitle="How you appear to other members of the network." />
      <ProfileWizard initial={initial} redirectTo="/dashboard/profile" />
    </div>
  )
}
