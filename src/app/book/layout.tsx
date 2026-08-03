import "../waitlist/waitlist.css"

// Wraps /book in the same scoped dark luxury theme as /waitlist and /waitlist/success.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
