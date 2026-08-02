import "../join/waitlist.css"

// Wraps /register in the shared dark luxury theme (scoped to .wl-root).
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
