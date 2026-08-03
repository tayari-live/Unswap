import "./waitlist.css"

// Wraps /waitlist and /waitlist/success in the scoped dark luxury theme.
export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
