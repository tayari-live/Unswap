import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

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

        if (!user) {
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
    })
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
        // Always fetch the freshest profile info from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        })
        if (dbUser) {
          session.user.name = dbUser.fullName
          session.user.image = dbUser.imageUrl
          ;(session.user as any).role = dbUser.role
          ;(session.user as any).initials = dbUser.avatarInitials
        } else {
          ;(session.user as any).role = token.role as string
          ;(session.user as any).initials = token.initials as string
        }
        ;(session.user as any).id = token.id as string
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
