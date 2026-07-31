"use client"

import { BookingWidget } from "./booking-widget"

export function BookClient() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "var(--navy)", color: "var(--ivory)" }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 70% 10%, rgba(201,168,76,0.10) 0%, transparent 60%)", zIndex: 0 }} />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-12 sm:py-16">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/waitlist/logo.png" alt="UnSwap" style={{ width: 96, height: 96, objectFit: "contain", filter: "drop-shadow(0 0 18px rgba(201,168,76,0.35))" }} />
        </div>

        <div className="text-center mb-10">
          <h1 className="font-display" style={{ color: "var(--gold)", fontSize: "clamp(30px,5.5vw,46px)", fontWeight: 300, lineHeight: 1.1, marginBottom: "14px" }}>
            Book Your Assessment Call
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(245,240,232,0.65)", maxWidth: "440px", margin: "0 auto" }}>
            Grab 15–20 minutes with our team and we&apos;ll walk you through how UnSwap works, personally.
          </p>
        </div>

        <div style={{ borderRadius: "12px", padding: "4px", background: "rgba(10,14,26,0.6)", border: "1px solid rgba(201,168,76,0.2)", overflow: "hidden" }}>
          <BookingWidget />
        </div>

        <div className="mt-16 pt-10 border-t border-[rgba(201,168,76,0.15)]">
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "rgba(245,240,232,0.4)", textAlign: "center", marginBottom: "18px" }}>
            Prefer to watch first?
          </p>
          <h2 className="font-display" style={{ color: "var(--gold-light)", fontSize: "22px", fontWeight: 400, textAlign: "center", marginBottom: "16px" }}>
            The UnSwap Masterclass
          </h2>
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.15)" }}>
            <iframe
              src="https://www.youtube.com/embed/pgL7SVKtm3g?rel=0"
              title="UnSwap Masterclass"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <a href="/join" style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "rgba(245,240,232,0.3)", textDecoration: "none" }}>
            ← Back to Waitlist
          </a>
        </div>
      </div>
    </div>
  )
}
