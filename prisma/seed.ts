import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { computeCompletion } from "@/server/services/profile"

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
  //
  // `profileCompletion` is a cached derivation of the profile fields, kept in
  // step by updateProfile(). The seed used to hand-pick the number instead —
  // every member claimed a completion its own fields couldn't justify (Amara
  // said 100% on 4 of 7 fields, which actually computes to 57%), so the
  // dashboard treated her profile as finished while the edit wizard, which
  // recomputes from the fields, disagreed. It's derived below now, so the seed
  // can't claim more than it wrote.
  //
  // Completion is driven by which optional fields each member gets: the 7
  // counted fields are fullName, imageUrl, nationality, dutyStation,
  // organisation, languages, bio — so each one is worth ~14%. Only Amara gets a
  // photo (a 1x1 data URI — imageUrl holds base64 in this app, so real images
  // would bloat the seed), which makes her the one fully-complete member and
  // keeps a settled-dashboard state available to test against.
  const TINY_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

  const memberPassword = await bcrypt.hash("member1234", 12)
  const members = [
    { first: "Amara", last: "Okafor", email: "a.okafor@undp.org", org: "UNDP", nat: "Nigerian", duty: "Geneva", status: "FULLY_VERIFIED", trust: 4.8, tier: "professional_4x",
      languages: "English, French", bio: "Programme officer with UNDP, currently based in Geneva. I travel often for country missions and love hosting fellow staff.", image: TINY_PNG },
    { first: "Liang", last: "Chen", email: "l.chen@who.int", org: "World Health Organization", nat: "Chinese", duty: "Geneva", status: "FULLY_VERIFIED", trust: 4.6, tier: "unlimited_pro",
      languages: "Mandarin, English", bio: "Epidemiologist at WHO. Happy to share tips on settling into Geneva, and always glad of a home base when on mission." },
    { first: "Marcus", last: "Weber", email: "m.weber@imf.org", org: "International Monetary Fund", nat: "German", duty: "Vienna", status: "FULLY_VERIFIED", trust: 4.9, tier: "standard_2x",
      languages: "German, English", bio: "Economist with the IMF in Vienna. Quiet flat near the centre, ideal for anyone here on a short posting." },
    { first: "Elena", last: "Popova", email: "e.popova@unicef.org", org: "UNICEF", nat: "Russian", duty: "New York", status: "FULLY_VERIFIED", trust: 4.7, tier: "limited_1x",
      languages: "Russian, English" },
    { first: "Sofia", last: "Rossi", email: "s.rossi@fao.org", org: "FAO", nat: "Italian", duty: "Rome", status: "PENDING_ID_REVIEW", trust: null, tier: null,
      languages: "Italian, English" },
    { first: "Fatima", last: "Al-Rashid", email: "f.alrashid@unhcr.org", org: "UNHCR", nat: "Jordanian", duty: "Nairobi", status: "PENDING_ID_REVIEW", trust: null, tier: null },
    { first: "James", last: "Mensah", email: "j.mensah@worldbank.org", org: "World Bank Group", nat: "Ghanaian", duty: "Washington", status: "EMAIL_VERIFIED", trust: null, tier: null },
    { first: "Diego", last: "Fernandez", email: "d.fernandez@un.org", org: "United Nations", nat: "Chilean", duty: "Santiago", status: "REJECTED", trust: null, tier: null },
  ] satisfies {
    first: string; last: string; email: string; org: string; nat: string; duty: string
    status: string; trust: number | null; tier: string | null
    languages?: string; bio?: string; image?: string
  }[]

  const created: { id: string; status: string; tier: string | null }[] = []
  for (const m of members) {
    // Build the profile fields once, then derive completion from that same
    // object with the app's own function — so the two can never disagree.
    const profile = {
      fullName: `${m.first} ${m.last}`,
      imageUrl: m.image ?? null,
      organisation: m.org,
      nationality: m.nat,
      dutyStation: m.duty,
      languages: m.languages ?? "",
      bio: m.bio ?? "",
      // Collected but deliberately not scored, so it can't affect completion.
      linkedinUrl: null,
    }

    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        ...profile,
        email: m.email,
        passwordHash: memberPassword,
        firstName: m.first,
        lastName: m.last,
        role: "member",
        avatarInitials: initials(m.first, m.last),
        onboardedAt: new Date(),
        verificationStatus: m.status,
        profileCompletion: computeCompletion(profile),
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
        confirmedAt: new Date(), // seeded entries are already confirmed
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
