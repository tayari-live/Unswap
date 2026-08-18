import "../waitlist/waitlist.css"

// Wraps /book in the same scoped luxury theme as /waitlist. `wl-navy` pins the
// navy/gold palette in every theme, so the page is dark-only — no light mode.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root wl-navy">{children}</div>
}
