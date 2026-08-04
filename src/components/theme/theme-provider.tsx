"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

// App-wide theme provider. Only the dashboard/app surfaces read the flipping
// tokens; marketing/auth pages use fixed colours, so they're unaffected by the
// class on <html>. Defaults to the visitor's system preference, with a toggle.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
