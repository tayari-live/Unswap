"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Calendar, Users, Home } from "lucide-react"

type Row = {
  id: string
  status: string
  role: "host" | "guest"
  startDate: string
  endDate: string
  guests: number
  listing: { title: string; city: string; country: string; photos: { id: string }[] }
  other: { id: string; fullName: string; avatarInitials: string; organisation: string | null }
}

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function nights(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

function UpcomingExchangeCard({ r }: { r: Row }) {
  const isHost = r.role === "host"
  return (
    <Link href={`/dashboard/exchanges/${r.id}`} className="block group">
      <div className="bg-white rounded-[12px] border border-[var(--hair)] shadow-sm overflow-hidden flex flex-col md:flex-row transition-shadow hover:shadow-md">
        <div className="relative md:w-2/5 aspect-video md:aspect-auto bg-navy/5 overflow-hidden">
          {r.listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/photos/${r.listing.photos[0].id}`} alt={r.listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-navy/20">
              <Home size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-white text-[var(--teal)] shadow-sm">
              {r.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold-dark)] mb-2">
            {isHost ? "You're Hosting" : "You're Staying"}
          </div>
          <h3 className="font-display text-[32px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
            {r.listing.title}
          </h3>
          <div className="font-sans text-[15px] text-navy/70 mb-6">
            {r.listing.city}, {r.listing.country}
          </div>

          <div className="flex flex-col gap-2 font-sans text-[14px] text-navy font-medium mb-8">
            <span className="flex items-center gap-2"><Calendar size={15} className="text-[var(--gold)]" /> {fmt(r.startDate)} – {fmt(r.endDate)}</span>
            <span className="flex items-center gap-2"><Users size={15} className="text-[var(--gold)]" /> {r.guests} guests · {nights(r.startDate, r.endDate)} nights</span>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--hair)] pt-6 mt-auto">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-navy/5 text-navy flex items-center justify-center text-xs font-bold">
                {r.other.avatarInitials}
              </span>
              <span className="font-sans text-[13px] text-navy/80">
                {isHost ? "Guest" : "Host"}: <span className="font-bold">{r.other.fullName}</span>
              </span>
            </div>
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--gold-dark)] flex items-center gap-1">
              View Exchange &rarr;
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PastExchangeCard({ r }: { r: Row }) {
  const isHost = r.role === "host"
  return (
    <Link href={`/dashboard/exchanges/${r.id}`} className="block group">
      <div className="bg-white rounded-[10px] border border-[var(--hair)] shadow-sm overflow-hidden flex flex-col md:flex-row p-4 gap-6 transition-shadow hover:shadow-md">
        <div className="relative w-full md:w-48 aspect-video md:aspect-[4/3] bg-navy/5 overflow-hidden rounded-md">
          {r.listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/photos/${r.listing.photos[0].id}`} alt={r.listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-navy/20">
              <Home size={24} />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between mb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-navy/40">
              {isHost ? "Hosted" : "Stayed"}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded bg-navy/5 text-navy/70">
              {r.status.replace("_", " ")}
            </span>
          </div>
          
          <h3 className="font-display text-[22px] font-bold text-navy leading-none mb-1 group-hover:text-[var(--gold-dark)] transition-colors">
            {r.listing.title}
          </h3>
          <div className="font-sans text-[13px] text-navy/60 mb-4">
            {r.listing.city}, {r.listing.country}
          </div>

          <div className="flex flex-wrap items-center gap-4 font-sans text-[13px] text-navy font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-navy/30" /> {fmt(r.startDate)} – {fmt(r.endDate)}</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-navy/30" /> {nights(r.startDate, r.endDate)} nights</span>
            <span className="text-navy/30">|</span>
            <span className="text-navy/70">{isHost ? "Guest" : "Host"}: <span className="font-bold">{r.other.fullName}</span></span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ExchangesClient({ upcoming, past }: { upcoming: Row[], past: Row[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")
  const data = tab === "upcoming" ? upcoming : past

  const tabBtn = (key: typeof tab, label: string, count: number) => (
    <button
      onClick={() => setTab(key)}
      className={`px-5 py-2.5 text-[14px] font-sans font-bold transition-colors border-b-2 ${
        tab === key ? "border-[var(--gold)] text-navy" : "border-transparent text-navy/40 hover:text-navy/60"
      }`}
    >
      {label} {count > 0 && <span className={tab === key ? "text-[var(--gold-dark)]" : "text-navy/40"}>({count})</span>}
    </button>
  )

  return (
    <>
      <div className="flex gap-6 mb-8 border-b border-[var(--hair)]">
        {tabBtn("upcoming", "Upcoming & Active", upcoming.length)}
        {tabBtn("past", "Completed", past.length)}
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--hair)] p-12 text-center max-w-2xl mx-auto shadow-sm mt-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--parchment)] text-[var(--gold-dark)] flex items-center justify-center mb-6">
            <Calendar size={28} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[32px] font-bold text-navy mb-3 leading-tight">Your first exchange is waiting.</h2>
          <p className="font-sans text-[15px] text-navy/65 mb-8 max-w-md mx-auto">
            {tab === "upcoming" ? "Once a swap request is accepted, it will appear here with all the details for your stay." : "You haven't completed any exchanges yet."}
          </p>
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center justify-center text-[13px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] px-8 py-3.5 rounded-md transition-colors shadow-sm"
          >
            Explore Homes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {tab === "upcoming"
            ? data.map((r) => <UpcomingExchangeCard key={r.id} r={r} />)
            : data.map((r) => <PastExchangeCard key={r.id} r={r} />)
          }
        </div>
      )}
    </>
  )
}
