import Link from "next/link"
import { XCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { getGuarantorRequest } from "@/server/services/guarantor"
import { GuarantorRespond } from "./guarantor-respond"

export const dynamic = "force-dynamic"

export default async function GuarantorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let data: Awaited<ReturnType<typeof getGuarantorRequest>> | null = null
  let message = ""
  try {
    data = await getGuarantorRequest(token ?? "")
  } catch (err: any) {
    message = err?.message || "This guarantor link is invalid."
  }

  return (
    <AuthShell
      eyebrow="Guarantor"
      title={data ? "Vouch for a colleague" : "Guarantor request"}
      logoHref={null}
      footer={
        <p className="text-sm text-wl-ivory-dim">
          UnSwap is a verified network for UN, World Bank and IMF professionals.{" "}
          <Link href="/" className="text-wl-gold hover:text-wl-gold-light transition-colors">
            Learn more
          </Link>
        </p>
      }
    >
      {data ? (
        <GuarantorRespond
          token={token!}
          memberName={data.memberName}
          memberFirstName={data.memberFirstName}
          organisation={data.organisation}
        />
      ) : (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border border-[rgba(193,18,31,0.4)] text-error-light flex items-center justify-center mb-6">
            <XCircle size={26} strokeWidth={1.4} />
          </div>
          <div className="border-l-2 border-[rgba(193,18,31,0.5)] bg-[rgba(193,18,31,0.08)] px-4 py-3.5 text-sm text-wl-ivory text-left">
            {message}
          </div>
        </div>
      )}
    </AuthShell>
  )
}
