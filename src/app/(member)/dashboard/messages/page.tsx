import { MessageSquare } from "lucide-react"

export default function MessagesEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--chat-bg)] h-full relative z-0">
      <div className="mx-auto w-16 h-16 rounded-md bg-[var(--surface)] border border-[var(--hair)] text-[var(--fg)]/30 flex items-center justify-center mb-5">
        <MessageSquare size={30} />
      </div>
      <h2 className="font-display text-xl font-bold text-[var(--fg)]">Select a message</h2>
      <p className="mt-2 text-sm text-neutral max-w-xs">
        Choose a conversation from the list to view the thread and swap details.
      </p>
    </div>
  )
}
