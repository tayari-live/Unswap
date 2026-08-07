import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme/theme-provider";

// Product UI — Inter. Carries every interface surface: dashboards, forms,
// tables, navigation.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Display — Cormorant Garamond. Marketing and hero use only; the brand guide
// keeps it out of dashboards and forms, where Inter reads better at UI sizes.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const SITE_URL = process.env.AUTH_URL || "http://localhost:3000";
const SITE_DESC =
  "The verified home exchange network built exclusively for UN, World Bank, IMF, and international organisation professionals. Enabling Mobility. Empowering Community.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "UnSwap | Exchange Homes. Not Money.",
    template: "%s | UnSwap",
  },
  description: SITE_DESC,
  applicationName: "UnSwap",
  openGraph: {
    type: "website",
    siteName: "UnSwap",
    title: "UnSwap | Exchange Homes. Not Money.",
    description: SITE_DESC,
    url: SITE_URL,
    images: [{ url: "/unswap-logo.png", width: 480, height: 480, alt: "UnSwap" }],
  },
  twitter: {
    card: "summary",
    title: "UnSwap | Exchange Homes. Not Money.",
    description: SITE_DESC,
    images: ["/unswap-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>
            {children}
          {/*
            No cookie-consent banner is mounted: the app only sets the
            strictly-necessary NextAuth session cookie, which requires no consent.
            TODO: Before adding ANY cookie-based analytics or marketing script
            (GA4, PostHog cookie mode, Meta pixel, etc.), re-mount <CookieConsent />
            from src/components/site/cookie-consent.tsx and gate the script on the
            stored choice. Cookieless analytics (Plausible/Fathom) need no banner.
          */}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
