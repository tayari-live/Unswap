import "../waitlist/waitlist.css"

// Register shares the waitlist's scoped luxury theme. `wl-navy` keeps the
// navy/gold treatment in light mode too (instead of the bright parchment
// ground), so the auth page reads the same in both themes.
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root wl-navy">{children}</div>
}
