import "../join/waitlist.css"

// Wraps /book in the same scoped dark luxury theme as /join and /join/success.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
