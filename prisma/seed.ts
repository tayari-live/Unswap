import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Institutional domains from the PRD allowlist.
const DOMAINS: { domain: string; label: string; fastTrack: boolean }[] = [
  { domain: "un.org", label: "United Nations", fastTrack: true },
  { domain: "undp.org", label: "UNDP", fastTrack: true },
  { domain: "unicef.org", label: "UNICEF", fastTrack: true },
  { domain: "who.int", label: "World Health Organization", fastTrack: true },
  { domain: "unhcr.org", label: "UNHCR", fastTrack: true },
  { domain: "imf.org", label: "International Monetary Fund", fastTrack: true },
  { domain: "worldbank.org", label: "World Bank Group", fastTrack: true },
  { domain: "ilo.org", label: "ILO", fastTrack: true },
  { domain: "fao.org", label: "FAO", fastTrack: true },
  { domain: "wfp.org", label: "World Food Programme", fastTrack: true },
  { domain: "unaids.org", label: "UNAIDS", fastTrack: true },
  { domain: "unep.org", label: "UNEP", fastTrack: true },
  { domain: "unfpa.org", label: "UNFPA", fastTrack: true },
  { domain: "habitat.un.org", label: "UN-Habitat", fastTrack: true },
  { domain: "ocha.un.org", label: "UN OCHA", fastTrack: true },
]

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()

// Tier presets (annual price + guarantee + yearly exchange allowance).
const TIERS: Record<string, { exchangesPerYear: number; priceAnnual: number; propertyGuarantee: number }> = {
  limited_1x: { exchangesPerYear: 1, priceAnnual: 129, propertyGuarantee: 500_000 },
  standard_2x: { exchangesPerYear: 2, priceAnnual: 219, propertyGuarantee: 1_000_000 },
  professional_4x: { exchangesPerYear: 4, priceAnnual: 349, propertyGuarantee: 1_500_000 },
  unlimited_pro: { exchangesPerYear: -1, priceAnnual: 449, propertyGuarantee: 2_000_000 },
  lifetime: { exchangesPerYear: -1, priceAnnual: 3143, propertyGuarantee: 2_000_000 },
}

async function main() {
  console.log("Seeding UnSwap dashboard...")

  // --- Domains ---
  for (const d of DOMAINS) {
    await prisma.allowedDomain.upsert({
      where: { domain: d.domain },
      update: { label: d.label, fastTrack: d.fastTrack },
      create: d,
    })
  }

  // --- Admin (Verification Officer) ---
  const adminPassword = await bcrypt.hash("admin1234", 12)
  await prisma.user.upsert({
    where: { email: "hello@unswap.net" },
    update: {},
    create: {
      email: "hello@unswap.net",
      passwordHash: adminPassword,
      firstName: "UnSwap",
      lastName: "Admin",
      fullName: "UnSwap Admin",
      role: "admin",
      avatarInitials: "UA",
      verificationStatus: "FULLY_VERIFIED",
      organisation: "UnSwap",
    },
  })

  // --- Sample members ---
  const memberPassword = await bcrypt.hash("member1234", 12)
  const members = [
    { first: "Amara", last: "Okafor", email: "a.okafor@undp.org", org: "UNDP", nat: "Nigerian", duty: "Geneva", status: "FULLY_VERIFIED", completion: 100, trust: 4.8, tier: "professional_4x" },
    { first: "Liang", last: "Chen", email: "l.chen@who.int", org: "World Health Organization", nat: "Chinese", duty: "Geneva", status: "FULLY_VERIFIED", completion: 95, trust: 4.6, tier: "unlimited_pro" },
    { first: "Sofia", last: "Rossi", email: "s.rossi@fao.org", org: "FAO", nat: "Italian", duty: "Rome", status: "PENDING_ID_REVIEW", completion: 70, trust: null, tier: null },
    { first: "Marcus", last: "Weber", email: "m.weber@imf.org", org: "International Monetary Fund", nat: "German", duty: "Vienna", status: "FULLY_VERIFIED", completion: 88, trust: 4.9, tier: "standard_2x" },
    { first: "Fatima", last: "Al-Rashid", email: "f.alrashid@unhcr.org", org: "UNHCR", nat: "Jordanian", duty: "Nairobi", status: "PENDING_ID_REVIEW", completion: 60, trust: null, tier: null },
    { first: "James", last: "Mensah", email: "j.mensah@worldbank.org", org: "World Bank Group", nat: "Ghanaian", duty: "Washington", status: "EMAIL_VERIFIED", completion: 40, trust: null, tier: null },
    { first: "Elena", last: "Popova", email: "e.popova@unicef.org", org: "UNICEF", nat: "Russian", duty: "New York", status: "FULLY_VERIFIED", completion: 92, trust: 4.7, tier: "limited_1x" },
    { first: "Diego", last: "Fernandez", email: "d.fernandez@un.org", org: "United Nations", nat: "Chilean", duty: "Santiago", status: "REJECTED", completion: 30, trust: null, tier: null },
  ]

  const created: { id: string; status: string; tier: string | null }[] = []
  for (const m of members) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash: memberPassword,
        firstName: m.first,
        lastName: m.last,
        fullName: `${m.first} ${m.last}`,
        role: "member",
        avatarInitials: initials(m.first, m.last),
        organisation: m.org,
        nationality: m.nat,
        dutyStation: m.duty,
        onboardedAt: new Date(),
        verificationStatus: m.status,
        profileCompletion: m.completion,
        trustScore: m.trust ?? undefined,
      },
    })
    created.push({ id: u.id, status: m.status, tier: m.tier })

    if (m.tier) {
      const preset = TIERS[m.tier]
      await prisma.subscription.upsert({
        where: { userId: u.id },
        update: {},
        create: {
          userId: u.id,
          tier: m.tier,
          status: "active",
          ...preset,
          renewsAt: m.tier === "lifetime" ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 200),
        },
      })
    }
  }

  // --- Verification submissions (queue) ---
  await prisma.verificationSubmission.deleteMany({})
  for (const c of created) {
    if (c.status === "PENDING_ID_REVIEW") {
      await prisma.verificationSubmission.create({
        data: {
          memberId: c.id,
          type: "fast_track",
          idCardUrl: "https://placehold.co/600x380?text=Staff+ID+Card",
          status: "PENDING",
        },
      })
    }
  }

  // --- Listings ---
  await prisma.listing.deleteMany({})
  const verifiedMembers = created.filter((c) => c.status === "FULLY_VERIFIED")
  const listingData = [
    { title: "Bright 2-bed near Lake Geneva", type: "Apartment", city: "Geneva", country: "Switzerland", bd: 2, ba: 1, guests: 4, status: "ACTIVE", rating: 4.8 },
    { title: "Family townhouse in Trastevere", type: "Townhouse", city: "Rome", country: "Italy", bd: 3, ba: 2, guests: 5, status: "ACTIVE", rating: 4.9 },
    { title: "Modern studio, UN Plaza", type: "Studio", city: "New York", country: "USA", bd: 1, ba: 1, guests: 2, status: "ACTIVE", rating: 4.6 },
    { title: "Quiet villa in Karen", type: "Villa", city: "Nairobi", country: "Kenya", bd: 4, ba: 3, guests: 8, status: "PAUSED", rating: 4.7 },
    { title: "Central flat near Ringstrasse", type: "Apartment", city: "Vienna", country: "Austria", bd: 2, ba: 1, guests: 3, status: "DRAFT", rating: null },
  ]
  const createdListings: string[] = []
  for (let i = 0; i < listingData.length; i++) {
    const l = listingData[i]
    const owner = verifiedMembers[i % verifiedMembers.length]
    if (!owner) continue
    const listing = await prisma.listing.create({
      data: {
        ownerId: owner.id,
        title: l.title,
        propertyType: l.type,
        city: l.city,
        country: l.country,
        bedrooms: l.bd,
        bathrooms: l.ba,
        maxGuests: l.guests,
        status: l.status,
        rating: l.rating ?? undefined,
        primaryPhotoUrl: `https://placehold.co/600x400?text=${encodeURIComponent(l.city)}`,
      },
    })
    createdListings.push(listing.id)
  }

  // --- Swap requests ---
  await prisma.swapRequest.deleteMany({})
  if (verifiedMembers.length >= 2 && createdListings.length >= 2) {
    const statuses = ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"]
    for (let i = 0; i < 4; i++) {
      const requester = verifiedMembers[i % verifiedMembers.length]
      const host = verifiedMembers[(i + 1) % verifiedMembers.length]
      await prisma.swapRequest.create({
        data: {
          requesterId: requester.id,
          hostId: host.id,
          listingId: createdListings[i % createdListings.length],
          mode: i % 2 === 0 ? "simultaneous" : "credits",
          startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (14 + i * 7)),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (28 + i * 7)),
          guests: 2,
          status: statuses[i],
          disputed: i === 2,
        },
      })
    }
  }

  // --- Waitlist ---
  await prisma.waitlistEntry.deleteMany({})
  const waitlist = [
    { first: "Priya", last: "Sharma", email: "priya.sharma@example.org", org: "UNDP", referrals: 6, status: "pending" },
    { first: "Tom", last: "Anders", email: "tom.anders@example.org", org: "WFP", referrals: 2, status: "invited" },
    { first: "Yuki", last: "Tanaka", email: "yuki.tanaka@example.org", org: "ILO", referrals: 0, status: "pending" },
    { first: "Nadia", last: "Haddad", email: "nadia.haddad@example.org", org: "UNESCO", referrals: 4, status: "converted" },
  ]
  for (const w of waitlist) {
    await prisma.waitlistEntry.create({
      data: {
        firstName: w.first,
        lastName: w.last,
        email: w.email,
        organisation: w.org,
        referralCode: `${w.first.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        referrals: w.referrals,
        status: w.status,
      },
    })
  }

  // --- Notifications ---
  await prisma.notification.deleteMany({})
  await prisma.notification.createMany({
    data: [
      { type: "verification", title: "2 verifications awaiting review", body: "New ID submissions are in the queue.", link: "/verification" },
      { type: "dispute", title: "Swap dispute flagged", body: "A swap between members needs mediation.", link: "/swaps" },
    ],
  })

  console.log("Seed complete.")
  console.log("Admin login: hello@unswap.net / admin1234")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
