import "../waitlist/waitlist.css"

// Shares the waitlist's scoped theme (light cream / dark obsidian). The AuthShell
// used by /resume also reads its colours from this .wl-root scope.
export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <div className="wl-root">{children}</div>
}
