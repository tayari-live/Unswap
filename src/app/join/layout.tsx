import "./waitlist.css"

// Wraps /join and /join/success in the scoped dark luxury theme.
export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
