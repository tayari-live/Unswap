import "./waitlist.css"

// Wraps /waitlist and /waitlist/success in the scoped luxury theme. `wl-navy`
// pins the navy/gold palette in every theme, so the waitlist is dark-only — no
// light mode — matching the /login and /register treatment.
export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root wl-navy">{children}</div>
}
