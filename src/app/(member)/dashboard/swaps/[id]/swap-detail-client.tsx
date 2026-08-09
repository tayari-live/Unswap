"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

export function SwapDetailClient({ swap, isIncoming }: { swap: { id: string, status: string }, isIncoming: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  
  // Modals state
  const [showAccept, setShowAccept] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  async function act(action: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/swaps/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || "Action failed.", "error")
      } else {
        toast("Done", "success")
        setShowAccept(false)
        setShowDecline(false)
        setShowCancel(false)
        router.push("/dashboard/swaps") // Return to list after action
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  // Determine what actions are available based on status
  const canRespond = isIncoming && swap.status === "REQUESTED"
  const canCancel = !isIncoming && (swap.status === "REQUESTED" || swap.status === "COUNTER_OFFERED")
  
  if (!canRespond && !canCancel) {
    return (
      <div className="flex items-center justify-center p-6 bg-[var(--parchment-dark)] rounded-lg text-[13px] font-bold uppercase tracking-[0.1em] text-navy/50">
        Status: {swap.status.replace("_", " ")}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-[var(--parchment-dark)] rounded-xl">
        <div className="mb-6 sm:mb-0 text-center sm:text-left">
          <h3 className="font-display text-[24px] font-bold text-navy mb-1">
            Ready to {isIncoming ? "respond" : "cancel"}?
          </h3>
          <p className="font-sans text-[14px] text-navy/60">
            {isIncoming ? "This will notify the requester immediately." : "This request will be permanently withdrawn."}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {canRespond && (
            <>
              <button onClick={() => setShowDecline(true)} className="flex-1 sm:flex-none inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-transparent border border-navy/20 hover:bg-navy/5 px-6 py-4 rounded transition-colors">
                Decline Request
              </button>
              <button onClick={() => setShowAccept(true)} className="flex-1 sm:flex-none inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] px-8 py-4 rounded transition-colors shadow-sm">
                Accept Request
              </button>
            </>
          )}
          
          {canCancel && (
            <button onClick={() => setShowCancel(true)} className="flex-1 sm:flex-none inline-flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--crimson)] bg-transparent border border-[var(--crimson)]/30 hover:bg-[var(--crimson)]/10 px-8 py-4 rounded transition-colors">
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Accept Modal */}
      {showAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="font-display text-[28px] font-bold text-navy leading-none mb-3">Accept this exchange?</h3>
            <p className="font-sans text-[15px] text-navy/70 mb-8">This will confirm the stay and generate the final Swap Agreement.</p>
            <div className="flex items-center justify-end gap-3">
              <button disabled={busy} onClick={() => setShowAccept(false)} className="px-5 py-3 text-[13px] font-bold text-navy hover:bg-[var(--parchment)] rounded transition-colors">Cancel</button>
              <button disabled={busy} onClick={() => act("accept")} className="px-6 py-3 text-[13px] font-bold text-navy bg-[var(--gold)] hover:bg-[var(--gold-dark)] rounded transition-colors shadow-sm">Accept Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="font-display text-[28px] font-bold text-navy leading-none mb-3">Decline request?</h3>
            <p className="font-sans text-[15px] text-navy/70 mb-8">You are about to decline this request. The requester will be notified.</p>
            <div className="flex items-center justify-end gap-3">
              <button disabled={busy} onClick={() => setShowDecline(false)} className="px-5 py-3 text-[13px] font-bold text-navy hover:bg-[var(--parchment)] rounded transition-colors">Cancel</button>
              <button disabled={busy} onClick={() => act("decline")} className="px-6 py-3 text-[13px] font-bold text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20 rounded transition-colors shadow-sm">Decline Request</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="font-display text-[28px] font-bold text-navy leading-none mb-3">Withdraw request?</h3>
            <p className="font-sans text-[15px] text-navy/70 mb-8">Are you sure you want to cancel your request for this property?</p>
            <div className="flex items-center justify-end gap-3">
              <button disabled={busy} onClick={() => setShowCancel(false)} className="px-5 py-3 text-[13px] font-bold text-navy hover:bg-[var(--parchment)] rounded transition-colors">Go Back</button>
              <button disabled={busy} onClick={() => act("cancel")} className="px-6 py-3 text-[13px] font-bold text-[var(--crimson)] bg-[var(--crimson)]/10 hover:bg-[var(--crimson)]/20 rounded transition-colors shadow-sm">Cancel Request</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
