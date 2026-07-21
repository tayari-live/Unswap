import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { getConversationForUser } from "@/server/services/messaging"
import { Thread } from "./thread"

export const dynamic = "force-dynamic"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login")

  const { id } = await params
  let convo
  try {
    convo = await getConversationForUser(userId, id)
  } catch {
    redirect("/dashboard/messages")
  }

  const initialMessages = convo.messages.map((m: any) => ({
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    createdAt: m.createdAt.toISOString(),
    deletedForEveryone: m.deletedForEveryone,
  }))

  return (
    <Thread
      conversationId={convo.id}
      currentUserId={userId}
      other={convo.other ?? null}
      initialMessages={initialMessages}
      swapRequest={convo.swapRequest}
      initialOtherLastReadAt={convo.otherLastReadAt ? convo.otherLastReadAt.toISOString() : null}
      initialOtherLastSeenAt={convo.otherLastSeenAt ? convo.otherLastSeenAt.toISOString() : null}
      initialOtherOnline={convo.otherOnline}
    />
  )
}
