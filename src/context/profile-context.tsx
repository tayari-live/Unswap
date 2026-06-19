"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type ProfileState = {
  name: string
  image: string | null
  initials: string
}

type ProfileContextValue = {
  profile: ProfileState
  updateProfile: (patch: Partial<ProfileState>) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial: ProfileState
}) {
  const [profile, setProfile] = useState<ProfileState>(initial)

  const updateProfile = (patch: Partial<ProfileState>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider")
  return ctx
}
