import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/server/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // No account, or a passwordless account still completing setup (no hash
        // yet) — password login is not available until they set one.
        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          // Image is intentionally omitted from the auth user → never enters the
          // JWT. Large base64 photos would bloat (and chunk) the session cookie
          // and break decryption. The session callback loads it fresh from the DB.
          image: null,
          initials: user.avatarInitials,
          remember: credentials.remember === "true",
        }
      }
    }),
    // Passwordless sign-in via a single-use token (waitlist invite hand-off and
    // "resume setup" links). Authorizes on the token instead of a password; the
    // token is consumed here so it can never be replayed.
    Credentials({
      id: "onetime",
      name: "One-time link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token as string | undefined
        if (!token) return null

        const rec = await prisma.loginToken.findUnique({
          where: { token },
          include: { user: true },
        })
        if (!rec || rec.usedAt || rec.expiresAt < new Date()) return null

        // Single use: consume before issuing the session.
        await prisma.loginToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } })

        const user = rec.user
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          image: null,
          initials: user.avatarInitials,
          remember: false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.initials = (user as any).initials
        token.remember = (user as any).remember === true
      }
      // Defensively strip any image Auth.js may have mapped onto the token
      // (token.picture). Large base64 photos bloat and chunk the cookie, which
      // breaks JWE decryption. The session callback reloads imageUrl from the DB.
      if ((token as any).picture) delete (token as any).picture
      // "Keep me signed in": persist 30 days when checked, otherwise expire after
      // 1 day (short, non-persistent session window).
      if (token.remember !== undefined) {
        const maxAge = token.remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60
        token.exp = Math.floor(Date.now() / 1000) + maxAge
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        // Refresh the freshest profile info from the DB — but never let a
        // transient DB blip (e.g. a serverless Postgres cold start / auto-suspend)
        // throw here, or NextAuth surfaces it as JWTSessionError and 500s every
        // authed page. On any failure, fall back to the values carried in the JWT.
        try {
          // Deliberately NOT `findUnique` with no select: that pulls every
          // column, and imageUrl holds a base64 photo (~130 KB observed), which
          // this callback would then transfer on every single page render. We
          // select the few fields we need plus a hash of the photo, and serve
          // the bytes from /api/avatar so the browser caches them.
          // `onboardedAt` and `verificationStatus` ride along here on purpose:
          // the member layout gates on both, and fetching them separately meant
          // two sequential round-trips before anything could render — including
          // the loading skeleton, which sits inside that layout.
          const rows = await prisma.$queryRaw<
            {
              fullName: string
              role: string
              avatarInitials: string
              imgHash: string | null
              onboardedAt: Date | null
              verificationStatus: string
              needsPassword: boolean
            }[]
          >`
            SELECT "fullName", "role", "avatarInitials", "onboardedAt", "verificationStatus",
                   ("passwordHash" IS NULL) AS "needsPassword",
                   CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN NULL
                        ELSE md5("imageUrl") END AS "imgHash"
            FROM "User" WHERE "id" = ${token.id as string}
          `
          const dbUser = rows[0]
          if (dbUser) {
            session.user.name = dbUser.fullName
            // Short, cacheable URL instead of an inlined base64 data URL.
            session.user.image = dbUser.imgHash
              ? `/api/avatar/${token.id}?v=${dbUser.imgHash}`
              : null
            ;(session.user as any).role = dbUser.role
            ;(session.user as any).initials = dbUser.avatarInitials
            ;(session.user as any).onboardedAt = dbUser.onboardedAt
            ;(session.user as any).verificationStatus = dbUser.verificationStatus
            ;(session.user as any).needsPassword = dbUser.needsPassword
          } else {
            ;(session.user as any).role = token.role as string
            ;(session.user as any).initials = token.initials as string
          }
        } catch (err) {
          console.error("session callback: DB refresh failed, using JWT values", err)
          ;(session.user as any).role = token.role as string
          ;(session.user as any).initials = token.initials as string
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // ceiling; actual expiry set per-login in jwt callback
  },
  secret: process.env.AUTH_SECRET,
  // Trust the deployment host (Vercel sets the forwarded host headers). Lets
  // NextAuth construct callback URLs without a hardcoded AUTH_URL.
  trustHost: true,
})
