import "../waitlist/waitlist.css"

// Shares the waitlist's scoped theme; `wl-navy` keeps the navy/gold treatment in
// light mode too, matching /login and /register.
export default function ContinueLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root wl-navy">{children}</div>
}
