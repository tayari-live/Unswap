import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { prisma } from "@/server/prisma"
import { listConversations } from "@/server/services/messaging"
import { MessagesLayoutShell } from "./layout-shell"

export const dynamic = "force-dynamic"

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.verificationStatus !== "FULLY_VERIFIED") {
    return (
      <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-5.5rem)] -mt-6 -mx-4 md:-mx-8 bg-[var(--surface)] border-t border-[var(--hair)] items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-md border border-[var(--hair)] p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-[var(--surface)] border border-[var(--hair)] text-[var(--gold-dark)] flex items-center justify-center mb-5">
            <ShieldAlert size={26} />
          </div>
          <h2 className="font-sans text-2xl font-bold text-[var(--fg)]">Verification required</h2>
          <p className="mt-3 text-neutral leading-relaxed">Messaging is reserved for verified members. Complete verification to start conversations.</p>
          <Link href="/verify-identity" className="mt-7 inline-flex items-center justify-center py-3 px-6 rounded-sm text-[12px] font-medium uppercase tracking-[0.12em] text-[#0a0e1a] bg-[var(--gold)] hover:bg-[var(--gold-hover)] transition-colors w-full">
            Get verified
          </Link>
        </div>
      </div>
    )
  }

  const conversations = await listConversations(userId)

  return (
    <MessagesLayoutShell conversations={conversations}>
      {children}
    </MessagesLayoutShell>
  )
}
