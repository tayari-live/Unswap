import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { sendEmail, renderEmail } from "@/server/email"
import { notifyAllowed } from "@/server/services/notify"

const APP = () => process.env.AUTH_URL || "http://localhost:3000"
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))

const ATTACH_MAX_CHARS = 13_000_000 // ~10 MB encoded
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,/

const PARTICIPANT_USER = {
  select: { id: true, fullName: true, avatarInitials: true, organisation: true, verificationStatus: true },
} as const

/** Messaging is reserved for fully verified members (the walled garden). */
async function assertCanMessage(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } })
  if (!u) throw new ApiError(404, "Account not found.")
  if (u.verificationStatus !== "FULLY_VERIFIED") {
    throw new ApiError(403, "You must be fully verified to send messages.")
  }
  return u
}

/** Find the existing 1:1 conversation between two members, or create one. */
export async function startConversation(userId: string, otherUserId: string, swapRequestId?: string) {
  if (userId === otherUserId) throw new ApiError(400, "You cannot message yourself.")
  await assertCanMessage(userId)
  const other = await prisma.user.findUnique({ where: { id: otherUserId } })
  if (!other || other.role !== "member") throw new ApiError(404, "Member not found.")

  const mine = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  })
  const shared = await prisma.conversationParticipant.findFirst({
    where: { conversationId: { in: mine.map((m) => m.conversationId) }, userId: otherUserId },
  })
  if (shared) return shared.conversationId

  const convo = await prisma.conversation.create({
    data: {
      swapRequestId: swapRequestId ?? null,
      participants: { create: [{ userId }, { userId: otherUserId }] },
    },
  })
  return convo.id
}

/** Conversations for the inbox, with the other party, last message, and unread count. */
export async function listConversations(userId: string) {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: PARTICIPANT_USER } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  })

  const rows = await Promise.all(
    parts.map(async (p) => {
      const other = p.conversation.participants.find((x) => x.userId !== userId)?.user
      const unread = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          createdAt: { gt: p.lastReadAt },
        },
      })
      const last = p.conversation.messages[0]
      return {
        id: p.conversationId,
        other,
        lastMessage: last ? { body: last.body, createdAt: last.createdAt, hasAttachment: !!last.attachmentUrl } : null,
        lastMessageAt: p.conversation.lastMessageAt,
        unread,
      }
    })
  )

  rows.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
  return rows
}

/** Total unread messages across all conversations (for the nav badge). */
export async function getUnreadTotal(userId: string) {
  const parts = await prisma.conversationParticipant.findMany({ where: { userId } })
  let total = 0
  for (const p of parts) {
    total += await prisma.message.count({
      where: { conversationId: p.conversationId, senderId: { not: userId }, createdAt: { gt: p.lastReadAt } },
    })
  }
  return total
}

/** Fetch a conversation's messages (authorized) and mark it read for the viewer. */
export async function getConversationForUser(userId: string, conversationId: string) {
  const me = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  if (!me) throw new ApiError(404, "Conversation not found.")

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: PARTICIPANT_USER } },
      messages: { orderBy: { createdAt: "asc" } },
      swapRequest: {
        include: {
          listing: { select: { id: true, title: true, city: true, country: true, primaryPhotoUrl: true } },
        },
      },
    },
  })
  if (!convo) throw new ApiError(404, "Conversation not found.")

  // Mark read up to now.
  await prisma.conversationParticipant.update({
    where: { id: me.id },
    data: { lastReadAt: new Date() },
  })

  const other = convo.participants.find((p) => p.userId !== userId)?.user
  return { 
    id: convo.id, 
    other, 
    messages: convo.messages,
    swapRequest: convo.swapRequest 
  }
}

/** Send a message in a conversation the member belongs to. */
export async function sendMessage(input: {
  userId: string
  conversationId: string
  body?: string
  attachmentUrl?: string
}) {
  const me = await assertCanMessage(input.userId)
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: input.conversationId, userId: input.userId } },
  })
  if (!member) throw new ApiError(403, "You are not part of this conversation.")

  // Capture the prior message to throttle email notifications to one per turn.
  const prev = await prisma.message.findFirst({
    where: { conversationId: input.conversationId },
    orderBy: { createdAt: "desc" },
    select: { senderId: true },
  })

  const body = input.body?.trim() ?? ""
  let attachmentUrl = input.attachmentUrl
  if (attachmentUrl) {
    if (!IMAGE_DATA_URL.test(attachmentUrl)) throw new ApiError(400, "Attachments must be an image.")
    if (attachmentUrl.length > ATTACH_MAX_CHARS) throw new ApiError(413, "Attachment is too large (max 10 MB).")
  }
  if (!body && !attachmentUrl) throw new ApiError(400, "Message cannot be empty.")

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.userId,
      body,
      attachmentUrl: attachmentUrl ?? null,
    },
  })
  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: new Date() },
  })

  // Email the other participant — but only when this starts a new "turn"
  // (the previous message wasn't also from this sender), to avoid spamming.
  if (!prev || prev.senderId !== input.userId) {
    const other = await prisma.conversationParticipant.findFirst({
      where: { conversationId: input.conversationId, userId: { not: input.userId } },
      include: { user: { select: { email: true, firstName: true } } },
    })
    if (other?.user && (await notifyAllowed(other.userId, "messages"))) {
      const snippet = body ? esc(body.slice(0, 140)) : "Sent a photo"
      await sendEmail({
        to: other.user.email,
        subject: `New message from ${me.fullName} on UnSwap`,
        html: renderEmail({
          heading: `${esc(me.fullName)} sent you a message`,
          body: `<p>Hello ${esc(other.user.firstName)},</p><p style="background:#F1F3F7;border-radius:8px;padding:10px 14px">${snippet}</p>`,
          ctaLabel: "Open conversation",
          ctaUrl: `${APP()}/dashboard/messages/${input.conversationId}`,
        }),
      }).catch((e) => console.error("Message email failed:", e))
    }
  }

  return message
}
