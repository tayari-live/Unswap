import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/site/cookie-consent";

// Body / UI — DM Sans (300, 400, 500)
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

// Display / headings — Cormorant Garamond (300, 400, 600, 700 + italics)
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
      className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
