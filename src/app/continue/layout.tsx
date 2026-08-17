import "../waitlist/waitlist.css"

// Shares the waitlist's scoped theme (light cream / dark obsidian).
export default function ContinueLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
