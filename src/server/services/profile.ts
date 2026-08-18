import { prisma } from "@/server/prisma"
import { ApiError } from "@/server/http"
import { grantCreditsOnce } from "@/server/services/credits"

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,/
const MAX_PHOTO_CHARS = 8_000_000 // ~6 MB encoded

type ProfileShape = {
  fullName: string | null
  imageUrl: string | null
  nationality: string | null
  dutyStation: string | null
  organisation: string | null
  languages: string | null
  bio: string | null
  linkedinUrl: string | null
}

/**
 * The score at which a profile counts as complete. Single source of truth so
 * the checklist, the nudge notification and the credit reward never disagree.
 */
export const PROFILE_COMPLETE_AT = 100

/**
 * Profile completion as a percentage of filled fields.
 * Only fields the wizard treats as expected count toward the total — LinkedIn is
 * explicitly optional, so including it would put 100% out of reach for anyone
 * who chooses not to share it. It is still collected, just not scored.
 */
export function computeCompletion(u: ProfileShape): number {
  const fields = [
    u.fullName, u.imageUrl, u.nationality, u.dutyStation,
    u.organisation, u.languages, u.bio,
  ]
  const filled = fields.filter((f) => f && String(f).trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

export type ProfileInput = {
  fullName?: string
  imageUrl?: string | null
  nationality?: string
  dutyStation?: string
  organisation?: string
  languages?: string
  bio?: string
  linkedinUrl?: string
}

function clean(v: string | undefined | null) {
  const t = (v ?? "").trim()
  return t.length ? t : null
}

/** Update the member's profile and recompute completion. Returns the new %. */
export async function updateProfile(userId: string, input: ProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, "Account not found.")

  const fullName = input.fullName !== undefined ? clean(input.fullName) : user.fullName
  if (!fullName) throw new ApiError(400, "Display name is required.")

  let imageUrl = input.imageUrl === undefined ? user.imageUrl : input.imageUrl
  if (imageUrl && imageUrl.length > 0) {
    if (!IMAGE_DATA_URL.test(imageUrl)) throw new ApiError(400, "Photo must be a PNG, JPG, or WebP image.")
    if (imageUrl.length > MAX_PHOTO_CHARS) throw new ApiError(413, "Photo is too large. Use an image under 5 MB.")
  } else {
    imageUrl = imageUrl === null ? null : user.imageUrl
  }

  const next: ProfileShape = {
    fullName,
    imageUrl: imageUrl ?? null,
    nationality: input.nationality !== undefined ? clean(input.nationality) : user.nationality,
    dutyStation: input.dutyStation !== undefined ? clean(input.dutyStation) : user.dutyStation,
    organisation: input.organisation !== undefined ? clean(input.organisation) : user.organisation,
    languages: input.languages !== undefined ? clean(input.languages) : user.languages,
    bio: input.bio !== undefined ? clean(input.bio) : user.bio,
    linkedinUrl: input.linkedinUrl !== undefined ? clean(input.linkedinUrl) : user.linkedinUrl,
  }

  const avatarInitials = next.fullName!
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const completion = computeCompletion(next)

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: next.fullName!,
      imageUrl: next.imageUrl,
      nationality: next.nationality,
      dutyStation: next.dutyStation,
      organisation: next.organisation,
      languages: next.languages,
      bio: next.bio,
      linkedinUrl: next.linkedinUrl,
      avatarInitials,
      profileCompletion: completion,
    },
  })

  // Reward a fully completed profile (once per member). Members exchange with
  // people, not listings, so a complete profile is worth encouraging.
  if (completion >= PROFILE_COMPLETE_AT) await grantCreditsOnce(userId, "profile_complete")

  return { completion }
}

const NOTIFY_FIELDS = [
  "notifySwaps",
  "notifyMessages",
  "notifyReviews",
  "notifyReminders",
  "notifyMarketing",
] as const

/** Update a member's email notification preferences (per category). */
export async function updateNotificationPrefs(userId: string, prefs: Record<string, unknown>) {
  const data: Record<string, boolean> = {}
  for (const f of NOTIFY_FIELDS) {
    if (typeof prefs[f] === "boolean") data[f] = prefs[f] as boolean
  }
  if (Object.keys(data).length === 0) throw new ApiError(400, "No valid preferences provided.")
  await prisma.user.update({ where: { id: userId }, data })
  return { ok: true }
}

/** Mark the onboarding wizard complete. */
export async function finishOnboarding(userId: string) {
  // Onboarding is complete only once a property exists. The wizard already
  // waits for the listing to save before calling this, but the endpoint is
  // reachable on its own — without this check a member could POST to it and
  // open the gate without ever adding a home, which is the whole point of the
  // step.
  const listings = await prisma.listing.count({ where: { ownerId: userId } })
  if (listings === 0) {
    throw new ApiError(400, "Add your property to finish setting up your account.")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
  })
  return { ok: true }
}
