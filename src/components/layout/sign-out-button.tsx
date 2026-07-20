"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-[var(--crimson)] border border-[var(--crimson)]/20 hover:bg-[var(--crimson)]/10 transition-colors"
    >
      <LogOut size={16} />
      Sign out
    </button>
  )
}
