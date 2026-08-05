import "../waitlist/waitlist.css"

// Shares the waitlist's scoped luxury theme, so it inherits both the light
// (cream/navy) and dark (obsidian/gold) palettes from one source.
export default function ConfirmEmailLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
