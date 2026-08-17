import "../waitlist/waitlist.css"

// Shares the waitlist's scoped theme; `wl-navy` keeps the navy/gold treatment in
// light mode too, matching /login and /register. The AuthShell used by /resume
// also reads its colours from this .wl-root scope.
export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root wl-navy">{children}</div>
}
